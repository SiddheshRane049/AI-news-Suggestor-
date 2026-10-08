from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Article, User, Interaction
from backend.app.schemas import InteractionToggle, InteractionResponse
from backend.app.auth_utils import get_current_user

router = APIRouter(prefix="/interactions", tags=["Interactions"])


@router.post("/toggle", response_model=InteractionResponse)
def toggle_interaction(
    req: InteractionToggle,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == req.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    existing = db.query(Interaction).filter(
        Interaction.user_id == user.id,
        Interaction.article_id == req.article_id,
        Interaction.interaction_type == req.interaction_type
    ).first()

    should_activate = req.state if req.state is not None else (existing is None)

    if should_activate and not existing:
        inter = Interaction(
            user_id=user.id,
            article_id=req.article_id,
            interaction_type=req.interaction_type
        )
        db.add(inter)
        db.commit()
        active = True
    elif not should_activate and existing:
        db.delete(existing)
        db.commit()
        active = False
    else:
        active = (existing is not None)

    return {
        "article_id": req.article_id,
        "interaction_type": req.interaction_type,
        "active": active
    }


@router.get("/stats")
def get_user_interaction_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    likes_count = db.query(Interaction).filter(
        Interaction.user_id == user.id, Interaction.interaction_type == "like"
    ).count()
    saves_count = db.query(Interaction).filter(
        Interaction.user_id == user.id, Interaction.interaction_type == "save"
    ).count()
    reads_count = db.query(Interaction).filter(
        Interaction.user_id == user.id, Interaction.interaction_type == "read"
    ).count()

    return {
        "likes_count": likes_count,
        "saves_count": saves_count,
        "reads_count": reads_count
    }
