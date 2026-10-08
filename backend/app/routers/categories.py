from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models import Article
from backend.app.feeds import CATEGORIES_META, RSS_FEEDS

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    """Returns available news categories, their visual metadata, and current article counts."""
    # Count articles grouped by category
    counts = db.query(Article.category, func.count(Article.id)).group_by(Article.category).all()
    count_map = {cat: c for cat, c in counts}

    result = []
    for cat, meta in CATEGORIES_META.items():
        result.append({
            "name": cat,
            "icon": meta.get("icon", "Newspaper"),
            "description": meta.get("description", ""),
            "color": meta.get("color", "from-blue-500 to-indigo-500"),
            "feed_count": len(RSS_FEEDS.get(cat, [])),
            "article_count": count_map.get(cat, 0)
        })

    return result
