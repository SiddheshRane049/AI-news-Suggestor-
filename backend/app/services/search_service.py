import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from backend.app.models import Article


class SearchService:
    @staticmethod
    def search_articles(
        db: Session,
        query: str,
        category: Optional[str] = None,
        limit: int = 30
    ) -> List[Article]:
        """
        Performs multi-field keyword and token search across title, summary, tags, and category.
        """
        clean_query = query.strip()
        if not clean_query:
            q = db.query(Article)
            if category:
                q = q.filter(Article.category == category)
            return q.order_by(desc(Article.published_at)).limit(limit).all()

        tokens = [t for t in re.split(r'\s+', clean_query) if len(t) > 1]
        db_query = db.query(Article)

        if category:
            db_query = db_query.filter(Article.category == category)

        filters = []
        # Exact phrase in title or summary
        filters.append(Article.title.ilike(f"%{clean_query}%"))
        filters.append(Article.summary.ilike(f"%{clean_query}%"))
        filters.append(Article.tags.ilike(f"%{clean_query}%"))

        # Individual tokens
        for token in tokens[:4]:
            filters.append(Article.title.ilike(f"%{token}%"))
            filters.append(Article.summary.ilike(f"%{token}%"))
            filters.append(Article.tags.ilike(f"%{token}%"))

        db_query = db_query.filter(or_(*filters))
        results = db_query.order_by(desc(Article.importance_score), desc(Article.published_at)).limit(limit).all()
        return results


search_service = SearchService()
