from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import ArticleBase
from backend.app.auth_utils import get_current_user_optional
from backend.app.services.search_service import search_service
from backend.app.article_utils import attach_user_interactions

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=List[ArticleBase])
def search_articles(
    q: str = Query(..., min_length=1, description="Keyword or natural language query"),
    category: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    articles = search_service.search_articles(db, query=q, category=category, limit=limit)
    return attach_user_interactions(db, articles, user)
