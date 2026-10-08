from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models import Article, Interaction, User


def attach_user_interactions(
    db: Session,
    articles: List[Article],
    user: Optional[User],
    why_this_map: Optional[Dict[int, str]] = None
) -> List[Dict[str, Any]]:
    """Enriches article objects with user interaction states and 'why_this' metadata."""
    if not articles:
        return []

    article_ids = [a.id for a in articles]
    user_interactions = {}

    if user:
        interactions = db.query(Interaction).filter(
            Interaction.user_id == user.id,
            Interaction.article_id.in_(article_ids)
        ).all()
        for inter in interactions:
            if inter.article_id not in user_interactions:
                user_interactions[inter.article_id] = set()
            user_interactions[inter.article_id].add(inter.interaction_type)

    results = []
    for art in articles:
        inter_set = user_interactions.get(art.id, set())
        item = {
            "id": art.id,
            "title": art.title,
            "source": art.source,
            "url": art.url,
            "image_url": art.image_url,
            "published_at": art.published_at,
            "category": art.category,
            "summary": art.summary or art.title,
            "key_points": art.get_key_points(),
            "sentiment": art.sentiment or "Neutral",
            "tags": art.get_tags(),
            "reading_time": art.reading_time or 2,
            "importance_score": art.importance_score or 5.0,
            "ai_processed": art.ai_processed,
            "why_this": why_this_map.get(art.id) if why_this_map else None,
            "is_liked": "like" in inter_set,
            "is_saved": "save" in inter_set,
            "is_read": "read" in inter_set,
        }
        results.append(item)

    return results
