import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.models import Article
from backend.app.services.ingestion_service import ingestion_service
from backend.app.routers import (
    auth, articles, feed, search, chat, digest, interactions, categories, me, admin
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("news_app")

scheduler = BackgroundScheduler()


def scheduled_ingestion_job():
    logger.info("Executing scheduled RSS news ingestion...")
    try:
        res = ingestion_service.ingest_all_feeds(limit_per_feed=4, process_ai_limit=15)
        logger.info(f"Scheduled ingestion completed: {res}")
    except Exception as e:
        logger.error(f"Scheduled ingestion encountered error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI News Suggestor Backend...")
    init_db()

    # Configure background scheduler
    interval = max(5, settings.FETCH_INTERVAL_MINUTES)
    scheduler.add_job(
        scheduled_ingestion_job,
        "interval",
        minutes=interval,
        id="rss_ingest_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"APScheduler started with {interval}m interval.")

    # Check if initial seed/fetch needed
    db = SessionLocal()
    try:
        article_count = db.query(Article).count()
        if article_count == 0:
            logger.info("Database empty. Starting initial seed fetch in background...")
            asyncio.create_task(asyncio.to_thread(ingestion_service.ingest_all_feeds, 3, 10))
    finally:
        db.close()

    yield

    # Shutdown
    logger.info("Shutting down scheduler...")
    if scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="AI News Suggestor API",
    description="Personalized news curation, summarization, and grounded Q&A with NVIDIA NIM hosted LLMs.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = settings.cors_origins_list
if "*" not in origins:
    origins.append("*")  # Allow development access

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(articles.router)
app.include_router(feed.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(digest.router)
app.include_router(interactions.router)
app.include_router(categories.router)
app.include_router(me.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "AI News Suggestor API is active",
        "status": "healthy",
        "nvidia_configured": settings.is_nvidia_configured,
        "model": settings.NVIDIA_MODEL,
        "docs_url": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "nvidia_configured": settings.is_nvidia_configured
    }
