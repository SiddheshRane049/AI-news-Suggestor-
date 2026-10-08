import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    preferred_categories = Column(Text, default="[]")  # JSON list of strings
    onboarding_completed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    interactions = relationship("Interaction", back_populates="user", cascade="all, delete-orphan")
    digests = relationship("DailyDigest", back_populates="user", cascade="all, delete-orphan")

    def get_preferred_categories(self):
        try:
            return json.loads(self.preferred_categories or "[]")
        except Exception:
            return []

    def set_preferred_categories(self, categories_list):
        self.preferred_categories = json.dumps(categories_list)


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    source = Column(String(255), nullable=False, index=True)
    url = Column(String(1000), unique=True, nullable=False, index=True)
    image_url = Column(String(1000), nullable=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    raw_text = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)

    # AI Processed fields
    summary = Column(Text, nullable=True)
    key_points = Column(Text, default="[]")  # JSON list of strings
    sentiment = Column(String(50), default="Neutral")  # Positive, Negative, Neutral
    tags = Column(Text, default="[]")  # JSON list of strings
    reading_time = Column(Integer, default=2)  # minutes
    importance_score = Column(Float, default=5.0, index=True)  # 1.0 to 10.0
    ai_processed = Column(Boolean, default=False, index=True)
    ai_error = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    interactions = relationship("Interaction", back_populates="article", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_category_published", "category", "published_at"),
        Index("idx_importance_published", "importance_score", "published_at"),
    )

    def get_key_points(self):
        try:
            return json.loads(self.key_points or "[]")
        except Exception:
            return []

    def set_key_points(self, points):
        self.key_points = json.dumps(points)

    def get_tags(self):
        try:
            return json.loads(self.tags or "[]")
        except Exception:
            return []

    def set_tags(self, tags_list):
        self.tags = json.dumps(tags_list)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)  # "like", "save", "read", "dislike"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="interactions")
    article = relationship("Article", back_populates="interactions")

    __table_args__ = (
        UniqueConstraint("user_id", "article_id", "interaction_type", name="uq_user_article_interaction"),
    )


class DailyDigest(Base):
    __tablename__ = "daily_digests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date_str = Column(String(20), nullable=False, index=True)  # e.g. "2026-10-07"
    intro = Column(Text, nullable=False)
    article_ids = Column(Text, default="[]")  # JSON list of article IDs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="digests")

    def get_article_ids(self):
        try:
            return json.loads(self.article_ids or "[]")
        except Exception:
            return []

    def set_article_ids(self, ids):
        self.article_ids = json.dumps(ids)


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    articles_fetched = Column(Integer, default=0)
    articles_added = Column(Integer, default=0)
    llm_processed_count = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    status = Column(String(50), default="running")  # "running", "success", "partial_error", "failed"
    log_message = Column(Text, nullable=True)
