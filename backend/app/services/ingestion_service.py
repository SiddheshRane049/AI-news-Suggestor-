import datetime
import difflib
import logging
import re
import time
from typing import Optional, List, Dict, Tuple, Any
from bs4 import BeautifulSoup
import feedparser
import requests
from sqlalchemy.orm import Session
import trafilatura

from backend.app.database import SessionLocal
from backend.app.feeds import RSS_FEEDS
from backend.app.models import Article, IngestionLog
from backend.app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


def clean_html(raw_html: str) -> str:
    """Strips HTML tags and normalizes whitespace."""
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    # Remove scripts and styles
    for element in soup(["script", "style", "nav", "footer", "header"]):
        element.decompose()
    return " ".join(soup.get_text().split())


def extract_image_from_feed_entry(entry: dict) -> Optional[str]:
    """Finds image URL from media tags, enclosures, or embedded html."""
    # 1. media_content
    if "media_content" in entry and entry.media_content:
        for media in entry.media_content:
            if "url" in media and (media.get("medium") == "image" or any(media.get("url", "").endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])):
                return media["url"]
        if "url" in entry.media_content[0]:
            return entry.media_content[0]["url"]

    # 2. media_thumbnail
    if "media_thumbnail" in entry and entry.media_thumbnail:
        return entry.media_thumbnail[0].get("url")

    # 3. enclosures
    if "enclosures" in entry and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get("type", "").startswith("image/") or any(enc.get("href", "").endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                return enc.get("href")

    # 4. links
    if "links" in entry:
        for link in entry.links:
            if link.get("type", "").startswith("image/"):
                return link.get("href")

    # 5. Search HTML in summary or content
    html_content = ""
    if "summary" in entry:
        html_content += entry.summary
    if "content" in entry:
        for c in entry.content:
            html_content += c.get("value", "")

    if html_content:
        soup = BeautifulSoup(html_content, "html.parser")
        img = soup.find("img")
        if img and img.get("src"):
            src = img["src"]
            if src.startswith("http"):
                return src

    return None


def fetch_full_text(url: str, fallback_text: str = "") -> str:
    """Attempts to extract readable text using trafilatura with fallback."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            extracted = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
            if extracted and len(extracted.strip()) > 120:
                return extracted.strip()
    except Exception as e:
        logger.debug(f"Trafilatura failed for {url}: {e}")

    # Fallback to direct HTTP + BeautifulSoup if trafilatura missed
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            paragraphs = soup.find_all("p")
            text = " ".join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 30])
            if len(text) > 150:
                return text[:5000]
    except Exception:
        pass

    return clean_html(fallback_text)


def parse_published_date(entry: dict) -> datetime.datetime:
    """Parses date from RSS entry safely."""
    for attr in ["published_parsed", "updated_parsed", "created_parsed"]:
        parsed_tuple = getattr(entry, attr, None) or entry.get(attr)
        if parsed_tuple:
            try:
                return datetime.datetime(*parsed_tuple[:6])
            except Exception:
                pass
    return datetime.datetime.utcnow()


def is_duplicate_title(db: Session, title: str, category: str, threshold: float = 0.82) -> bool:
    """Checks if a similar title already exists in the same category within recent days."""
    recent_time = datetime.datetime.utcnow() - datetime.timedelta(days=3)
    recent_articles = db.query(Article.title).filter(
        Article.category == category,
        Article.published_at >= recent_time
    ).limit(100).all()

    clean_t1 = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower()).strip()
    for (existing_title,) in recent_articles:
        clean_t2 = re.sub(r'[^a-zA-Z0-9\s]', '', existing_title.lower()).strip()
        similarity = difflib.SequenceMatcher(None, clean_t1, clean_t2).ratio()
        if similarity >= threshold:
            return True
    return False


class IngestionService:
    def __init__(self):
        self._is_running = False

    def ingest_all_feeds(self, limit_per_feed: int = 5, process_ai_limit: int = 15) -> Dict[str, Any]:
        """
        Fetches all categories, stores new articles, and enriches them with AI analysis.
        Safe against concurrent runs.
        """
        if self._is_running:
            logger.info("Ingestion is already running. Skipping trigger.")
            return {"status": "already_running"}

        self._is_running = True
        db = SessionLocal()
        log = IngestionLog(
            started_at=datetime.datetime.utcnow(),
            status="running"
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        total_fetched = 0
        total_added = 0
        errors = 0
        error_messages = []

        try:
            for category, feeds in RSS_FEEDS.items():
                for feed_info in feeds:
                    feed_name = feed_info["name"]
                    feed_url = feed_info["url"]
                    try:
                        parsed = feedparser.parse(feed_url)
                        entries = parsed.entries[:limit_per_feed]
                        total_fetched += len(entries)

                        for entry in entries:
                            url = entry.get("link") or entry.get("id")
                            if not url:
                                continue

                            # Check URL existence
                            existing = db.query(Article).filter(Article.url == url).first()
                            if existing:
                                continue

                            title = clean_html(entry.get("title", ""))
                            if not title:
                                continue

                            # Title deduplication
                            if is_duplicate_title(db, title, category):
                                continue

                            published_at = parse_published_date(entry)
                            image_url = extract_image_from_feed_entry(entry)
                            raw_summary = entry.get("summary", "")

                            # Extract readable article text
                            raw_text = fetch_full_text(url, raw_summary)

                            article = Article(
                                title=title,
                                source=feed_name,
                                url=url,
                                image_url=image_url,
                                published_at=published_at,
                                raw_text=raw_text,
                                category=category,
                                ai_processed=False
                            )
                            db.add(article)
                            db.commit()
                            total_added += 1

                    except Exception as feed_err:
                        errors += 1
                        msg = f"Error fetching feed '{feed_name}' ({category}): {feed_err}"
                        logger.warning(msg)
                        error_messages.append(msg)

            # Process un-analyzed articles with AI
            processed_ai_count = self.process_unprocessed_articles(db, batch_limit=process_ai_limit)

            log.finished_at = datetime.datetime.utcnow()
            log.articles_fetched = total_fetched
            log.articles_added = total_added
            log.llm_processed_count = processed_ai_count
            log.errors_count = errors
            log.status = "success" if errors == 0 else "partial_error"
            log.log_message = "; ".join(error_messages[:5]) if error_messages else "Completed successfully"
            db.commit()

            return {
                "status": log.status,
                "articles_fetched": total_fetched,
                "articles_added": total_added,
                "llm_processed_count": processed_ai_count,
                "errors": errors
            }

        except Exception as general_err:
            logger.error(f"Ingestion job failed: {general_err}")
            log.finished_at = datetime.datetime.utcnow()
            log.status = "failed"
            log.log_message = str(general_err)
            db.commit()
            return {"status": "failed", "error": str(general_err)}
        finally:
            self._is_running = False
            db.close()

    def process_unprocessed_articles(self, db: Session, batch_limit: int = 20) -> int:
        """Processes pending articles using LLMService and updates database."""
        unprocessed = db.query(Article).filter(Article.ai_processed == False).order_by(Article.id.desc()).limit(batch_limit).all()
        count = 0

        for article in unprocessed:
            try:
                analysis = llm_service.analyze_article(
                    title=article.title,
                    source=article.source,
                    text=article.raw_text or article.title,
                    category=article.category
                )
                article.summary = analysis.summary
                article.set_key_points(analysis.key_points)
                article.sentiment = analysis.sentiment
                article.set_tags(analysis.tags)
                article.reading_time = analysis.reading_time
                article.importance_score = analysis.importance_score
                article.ai_processed = True
                article.ai_error = None
                db.commit()
                count += 1
            except Exception as e:
                logger.error(f"Error processing AI for article {article.id}: {e}")
                article.ai_error = str(e)
                # Fallback to heuristic so it doesn't get stuck indefinitely
                heuristic = llm_service._heuristic_fallback_analysis(
                    article.title, article.source, article.raw_text or "", article.category
                )
                article.summary = heuristic.summary
                article.set_key_points(heuristic.key_points)
                article.sentiment = heuristic.sentiment
                article.set_tags(heuristic.tags)
                article.reading_time = heuristic.reading_time
                article.importance_score = heuristic.importance_score
                article.ai_processed = True
                db.commit()
                count += 1

        return count


ingestion_service = IngestionService()
