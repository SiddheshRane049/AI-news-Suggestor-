from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: Optional[str] = None
    preferred_categories: Optional[List[str]] = []


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str]
    preferred_categories: List[str]
    onboarding_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PreferencesUpdate(BaseModel):
    preferred_categories: List[str]
    onboarding_completed: Optional[bool] = True


# LLM AI Processing Schema
class ArticleAIAnalysis(BaseModel):
    summary: str = Field(..., description="A 2-3 sentence concise executive summary")
    key_points: List[str] = Field(..., description="3 to 5 bullet points of key takeaways")
    sentiment: str = Field(..., description="Positive, Negative, or Neutral")
    tags: List[str] = Field(..., description="3 to 6 high quality topic tags (e.g. LLMs, Open Source, Semiconductor)")
    reading_time: int = Field(default=3, description="Estimated reading time in minutes (1 to 15)")
    importance_score: float = Field(default=5.0, description="Significance/impact score from 1.0 to 10.0")


# Article Schemas
class ArticleBase(BaseModel):
    id: int
    title: str
    source: str
    url: str
    image_url: Optional[str]
    published_at: datetime
    category: str
    summary: Optional[str]
    key_points: List[str] = []
    sentiment: str
    tags: List[str] = []
    reading_time: int
    importance_score: float
    ai_processed: bool
    why_this: Optional[str] = None

    # Interaction states for authenticated user
    is_liked: Optional[bool] = False
    is_saved: Optional[bool] = False
    is_read: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class ArticleDetail(ArticleBase):
    raw_text: Optional[str] = None


class ArticleListResponse(BaseModel):
    items: List[ArticleBase]
    total: int
    page: int
    page_size: int
    has_more: bool


# Interaction Schemas
class InteractionToggle(BaseModel):
    article_id: int
    interaction_type: str = Field(..., pattern="^(like|save|read|dislike)$")
    state: Optional[bool] = None  # None = toggle, True = add, False = remove



class InteractionResponse(BaseModel):
    article_id: int
    interaction_type: str
    active: bool


# Chat & Q&A Schemas
class ArticleChatRequest(BaseModel):
    article_id: int
    message: str
    history: Optional[List[Dict[str, str]]] = []  # [{"role": "user", "content": ...}, ...]


class NewsChatRequest(BaseModel):
    message: str
    category: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []


class ChatResponse(BaseModel):
    reply: str
    sources: Optional[List[Dict[str, Any]]] = []


# Digest Schemas
class DailyDigestResponse(BaseModel):
    date_str: str
    intro: str
    articles: List[ArticleBase]


class ExplainSimplyRequest(BaseModel):
    article_id: int


class ExplainSimplyResponse(BaseModel):
    article_id: int
    simplified_explanation: str
    key_metaphor: Optional[str] = None


# Admin & System Stats
class CategoryStat(BaseModel):
    name: str
    count: int
    feed_count: int


class AdminStatsResponse(BaseModel):
    total_articles: int
    ai_processed_count: int
    unprocessed_count: int
    total_users: int
    total_interactions: int
    last_fetch_time: Optional[datetime]
    fetch_status: str
    categories: List[CategoryStat]
    is_nvidia_key_set: bool
    nvidia_model: str


# Trending Tags
class TrendingTag(BaseModel):
    tag: str
    count: int
