import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Article, User, Interaction
from backend.app.schemas import ArticleBase, ArticleDetail, ArticleListResponse
from backend.app.auth_utils import get_current_user_optional, get_current_user
from backend.app.article_utils import attach_user_interactions

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.get("", response_model=ArticleListResponse)
def list_articles(
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    days: Optional[int] = Query(None),
    sort_by: str = Query("latest", pattern="^(latest|importance|reading_time)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Article)

    if category and category != "All":
        query = query.filter(Article.category == category)

    if source:
        query = query.filter(Article.source.ilike(f"%{source}%"))

    if sentiment:
        query = query.filter(Article.sentiment.ilike(sentiment))

    if days:
        since = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        query = query.filter(Article.published_at >= since)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Article.title.ilike(s)) | (Article.summary.ilike(s)) | (Article.tags.ilike(s))
        )

    if sort_by == "importance":
        query = query.order_by(desc(Article.importance_score), desc(Article.published_at))
    elif sort_by == "reading_time":
        query = query.order_by(Article.reading_time.asc(), desc(Article.published_at))
    else:
        query = query.order_by(desc(Article.published_at))

    total = query.count()
    offset = (page - 1) * page_size
    articles = query.offset(offset).limit(page_size).all()

    items = attach_user_interactions(db, articles, user)
    has_more = (offset + page_size) < total

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": has_more
    }


@router.get("/export/markdown")
def export_saved_markdown(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Exports user's saved/bookmarked articles as formatted Markdown."""
    saved_interactions = db.query(Interaction).filter(
        Interaction.user_id == user.id,
        Interaction.interaction_type == "save"
    ).all()

    article_ids = [inter.article_id for inter in saved_interactions]
    articles = db.query(Article).filter(Article.id.in_(article_ids)).order_by(desc(Article.published_at)).all()

    md_content = f"# AI News Suggestor - Bookmarked Articles\n"
    md_content += f"*Exported for {user.name or user.email} on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*\n\n"
    md_content += f"Total saved stories: {len(articles)}\n\n---\n\n"

    for idx, art in enumerate(articles, 1):
        md_content += f"## {idx}. [{art.title}]({art.url})\n"
        md_content += f"- **Category:** {art.category} | **Source:** {art.source} | **Date:** {art.published_at.strftime('%b %d, %Y')}\n"
        md_content += f"- **Sentiment:** {art.sentiment} | **Reading Time:** {art.reading_time} min | **Impact Score:** {art.importance_score}/10\n"
        if art.get_tags():
            md_content += f"- **Tags:** {', '.join(art.get_tags())}\n"
        md_content += f"\n### Summary\n{art.summary or 'No summary available.'}\n\n"
        if art.get_key_points():
            md_content += "### Key Takeaways\n"
            for pt in art.get_key_points():
                md_content += f"- {pt}\n"
        md_content += "\n---\n\n"

    filename = f"saved_news_{datetime.date.today().isoformat()}.md"
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/{article_id}", response_model=ArticleDetail)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Mark as read if user is logged in
    if user:
        existing_read = db.query(Interaction).filter(
            Interaction.user_id == user.id,
            Interaction.article_id == article.id,
            Interaction.interaction_type == "read"
        ).first()
        if not existing_read:
            read_inter = Interaction(
                user_id=user.id,
                article_id=article.id,
                interaction_type="read"
            )
            db.add(read_inter)
            db.commit()

    enriched = attach_user_interactions(db, [article], user)[0]
    enriched["raw_text"] = article.raw_text
    return enriched
