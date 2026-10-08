import datetime
import json
from collections import Counter
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Article, User
from backend.app.schemas import ArticleListResponse, TrendingTag, ArticleBase
from backend.app.auth_utils import get_current_user_optional
from backend.app.services.ranking_service import ranking_service
from backend.app.article_utils import attach_user_interactions

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("/for-you", response_model=ArticleListResponse)
def get_for_you_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    offset = (page - 1) * page_size
    scored_items = ranking_service.get_for_you_feed(db, user, limit=page_size, offset=offset)

    articles = [art for art, _ in scored_items]
    why_this_map = {art.id: why for art, why in scored_items}

    items = attach_user_interactions(db, articles, user, why_this_map=why_this_map)
    total = db.query(Article).count()
    has_more = (offset + page_size) < min(total, 250)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": has_more
    }


@router.get("/trending", response_model=List[ArticleBase])
def get_trending(
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    articles = ranking_service.get_trending_articles(db, limit=limit)
    return attach_user_interactions(db, articles, user)


@router.get("/trending-tags", response_model=List[TrendingTag])
def get_trending_tags(
    db: Session = Depends(get_db),
    limit: int = Query(15, ge=5, le=50)
):
    """Calculates tag frequencies from recent articles (last 48 hours)."""
    since = datetime.datetime.utcnow() - datetime.timedelta(days=2)
    recent_articles = db.query(Article.tags).filter(Article.published_at >= since).all()

    tag_counter = Counter()
    for (raw_tags,) in recent_articles:
        try:
            tags = json.loads(raw_tags or "[]")
            for t in tags:
                clean = t.strip()
                if len(clean) > 2 and clean.lower() not in ["news", "report", "update"]:
                    tag_counter[clean] += 1
        except Exception:
            continue

    if not tag_counter:
        # Fallback to general tags
        tag_counter = Counter({"AI": 12, "LLMs": 9, "NVIDIA": 8, "Startups": 7, "Security": 6, "Robotics": 5, "Semiconductors": 5})

    return [{"tag": tag, "count": count} for tag, count in tag_counter.most_common(limit)]
