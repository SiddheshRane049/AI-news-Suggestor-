from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Article, User
from backend.app.schemas import DailyDigestResponse, ExplainSimplyRequest, ExplainSimplyResponse
from backend.app.auth_utils import get_current_user_optional
from backend.app.services.digest_service import digest_service
from backend.app.services.llm_service import llm_service
from backend.app.article_utils import attach_user_interactions

router = APIRouter(prefix="/digest", tags=["Digest"])


@router.get("/daily", response_model=DailyDigestResponse)
def get_daily_digest(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    data = digest_service.get_or_create_daily_digest(db, user)
    articles_enriched = attach_user_interactions(db, data["articles"], user)
    return {
        "date_str": data["date_str"],
        "intro": data["intro"],
        "articles": articles_enriched
    }


@router.post("/explain-simply", response_model=ExplainSimplyResponse)
def explain_simply(
    req: ExplainSimplyRequest,
    db: Session = Depends(get_db)
):
    article = db.query(Article).filter(Article.id == req.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    content = article.summary or article.raw_text or article.title
    result = llm_service.explain_simply(
        title=article.title,
        summary_or_text=content
    )

    return {
        "article_id": article.id,
        "simplified_explanation": result["simplified_explanation"],
        "key_metaphor": result.get("key_metaphor")
    }
