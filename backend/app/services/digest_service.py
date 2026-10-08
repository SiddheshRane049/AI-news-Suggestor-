import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models import User, Article, DailyDigest
from backend.app.services.llm_service import llm_service


class DigestService:
    @staticmethod
    def get_or_create_daily_digest(db: Session, user: Optional[User]) -> Dict[str, Any]:
        """
        Retrieves or generates the personalized Daily Digest for today.
        """
        today_str = datetime.date.today().isoformat()
        user_id = user.id if user else 0

        # Check if digest exists for user today
        existing_digest = None
        if user:
            existing_digest = db.query(DailyDigest).filter(
                DailyDigest.user_id == user.id,
                DailyDigest.date_str == today_str
            ).first()

        if existing_digest:
            article_ids = existing_digest.get_article_ids()
            articles = db.query(Article).filter(Article.id.in_(article_ids)).all()
            # Preserve ordering
            article_map = {a.id: a for a in articles}
            ordered_articles = [article_map[aid] for aid in article_ids if aid in article_map]
            return {
                "date_str": today_str,
                "intro": existing_digest.intro,
                "articles": ordered_articles
            }

        # Otherwise curate top 10 articles
        query = db.query(Article)
        pref_cats = user.get_preferred_categories() if user else []

        if pref_cats:
            query = query.filter(Article.category.in_(pref_cats))

        # Recent 48 hours
        since = datetime.datetime.utcnow() - datetime.timedelta(days=2)
        top_articles = query.filter(Article.published_at >= since).order_by(
            Article.importance_score.desc(),
            Article.published_at.desc()
        ).limit(10).all()

        if not top_articles:
            top_articles = db.query(Article).order_by(Article.importance_score.desc()).limit(10).all()

        # Generate intro via LLM
        articles_payload = [
            {"title": a.title, "category": a.category, "summary": a.summary or a.title}
            for a in top_articles
        ]
        intro = llm_service.generate_daily_intro(
            top_articles=articles_payload,
            user_name=user.name if user else "Reader",
            preferred_categories=pref_cats
        )

        # Save to DB if user is logged in
        if user and top_articles:
            digest_record = DailyDigest(
                user_id=user.id,
                date_str=today_str,
                intro=intro
            )
            digest_record.set_article_ids([a.id for a in top_articles])
            db.add(digest_record)
            db.commit()

        return {
            "date_str": today_str,
            "intro": intro,
            "articles": top_articles
        }


digest_service = DigestService()
