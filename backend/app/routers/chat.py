from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Article
from backend.app.schemas import ArticleChatRequest, NewsChatRequest, ChatResponse
from backend.app.services.llm_service import llm_service
from backend.app.services.search_service import search_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/article", response_model=ChatResponse)
def chat_about_article(
    req: ArticleChatRequest,
    db: Session = Depends(get_db)
):
    article = db.query(Article).filter(Article.id == req.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    content = article.raw_text or article.summary or article.title
    reply = llm_service.chat_with_article(
        article_title=article.title,
        article_text=content,
        message=req.message,
        history=req.history
    )

    return {
        "reply": reply,
        "sources": [{
            "id": article.id,
            "title": article.title,
            "source": article.source,
            "url": article.url,
            "category": article.category
        }]
    }


@router.post("/news", response_model=ChatResponse)
def chat_with_todays_news(
    req: NewsChatRequest,
    db: Session = Depends(get_db)
):
    # Find relevant articles using search service
    articles = search_service.search_articles(
        db,
        query=req.message,
        category=req.category,
        limit=6
    )

    articles_dict = [
        {
            "id": a.id,
            "title": a.title,
            "source": a.source,
            "url": a.url,
            "category": a.category,
            "summary": a.summary or a.title
        }
        for a in articles
    ]

    reply, sources = llm_service.chat_with_daily_news(
        user_query=req.message,
        relevant_articles=articles_dict,
        history=req.history
    )

    return {
        "reply": reply,
        "sources": sources
    }
