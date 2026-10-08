from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import User, Article, Interaction
from backend.app.schemas import PreferencesUpdate, UserResponse, ArticleListResponse
from backend.app.auth_utils import get_current_user
from backend.app.article_utils import attach_user_interactions

router = APIRouter(prefix="/me", tags=["User Profile"])


@router.get("/preferences", response_model=UserResponse)
def get_preferences(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "preferred_categories": user.get_preferred_categories(),
        "onboarding_completed": user.onboarding_completed,
        "created_at": user.created_at
    }


@router.put("/preferences", response_model=UserResponse)
def update_preferences(
    prefs: PreferencesUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user.set_preferred_categories(prefs.preferred_categories)
    if prefs.onboarding_completed is not None:
        user.onboarding_completed = prefs.onboarding_completed
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "preferred_categories": user.get_preferred_categories(),
        "onboarding_completed": user.onboarding_completed,
        "created_at": user.created_at
    }


@router.get("/saved", response_model=ArticleListResponse)
def get_saved_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Article).join(Interaction, Interaction.article_id == Article.id).filter(
        Interaction.user_id == user.id,
        Interaction.interaction_type == "save"
    ).order_by(desc(Interaction.created_at))

    total = query.count()
    offset = (page - 1) * page_size
    articles = query.offset(offset).limit(page_size).all()

    items = attach_user_interactions(db, articles, user)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (offset + page_size) < total
    }


@router.get("/history", response_model=ArticleListResponse)
def get_reading_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Article).join(Interaction, Interaction.article_id == Article.id).filter(
        Interaction.user_id == user.id,
        Interaction.interaction_type == "read"
    ).order_by(desc(Interaction.created_at))

    total = query.count()
    offset = (page - 1) * page_size
    articles = query.offset(offset).limit(page_size).all()

    items = attach_user_interactions(db, articles, user)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (offset + page_size) < total
    }
