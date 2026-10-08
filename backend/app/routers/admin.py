from typing import List, Dict, Any
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.database import get_db
from backend.app.models import Article, User, Interaction, IngestionLog
from backend.app.schemas import AdminStatsResponse, CategoryStat
from backend.app.config import settings
from backend.app.feeds import RSS_FEEDS
from backend.app.services.ingestion_service import ingestion_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db)):
    total_articles = db.query(Article).count()
    ai_processed_count = db.query(Article).filter(Article.ai_processed == True).count()
    unprocessed_count = total_articles - ai_processed_count
    total_users = db.query(User).count()
    total_interactions = db.query(Interaction).count()

    last_log = db.query(IngestionLog).order_by(desc(IngestionLog.id)).first()
    last_fetch_time = last_log.started_at if last_log else None
    fetch_status = last_log.status if last_log else "never_run"

    # Category stats
    cat_counts = db.query(Article.category, func.count(Article.id)).group_by(Article.category).all()
    count_map = {cat: count for cat, count in cat_counts}

    categories_list = []
    for cat_name, feeds in RSS_FEEDS.items():
        categories_list.append(CategoryStat(
            name=cat_name,
            count=count_map.get(cat_name, 0),
            feed_count=len(feeds)
        ))

    return AdminStatsResponse(
        total_articles=total_articles,
        ai_processed_count=ai_processed_count,
        unprocessed_count=unprocessed_count,
        total_users=total_users,
        total_interactions=total_interactions,
        last_fetch_time=last_fetch_time,
        fetch_status=fetch_status,
        categories=categories_list,
        is_nvidia_key_set=settings.is_nvidia_configured,
        nvidia_model=settings.NVIDIA_MODEL
    )


@router.post("/fetch-now")
def trigger_fetch_now(background_tasks: BackgroundTasks):
    background_tasks.add_task(ingestion_service.ingest_all_feeds)
    return {"status": "Ingestion job dispatched to background"}


@router.post("/process-ai-now")
def trigger_ai_process_now(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(ingestion_service.process_unprocessed_articles, db, 25)
    return {"status": "AI processing batch dispatched to background"}


@router.get("/logs")
def get_ingestion_logs(limit: int = 15, db: Session = Depends(get_db)):
    logs = db.query(IngestionLog).order_by(desc(IngestionLog.id)).limit(limit).all()
    return logs
