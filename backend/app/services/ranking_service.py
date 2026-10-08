import datetime
import math
import random
from collections import defaultdict
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models import User, Article, Interaction


class RankingService:
    @staticmethod
    def compute_user_profile(db: Session, user: Optional[User]) -> Tuple[Dict[str, float], Dict[str, float], set]:
        """
        Calculates category and tag affinity weights for a user.
        Also returns a set of disliked article IDs to exclude completely.
        """
        category_weights = defaultdict(float)
        tag_weights = defaultdict(float)
        disliked_article_ids = set()

        if not user:
            return category_weights, tag_weights, disliked_article_ids

        # 1. Base weights from user's preferred categories
        for cat in user.get_preferred_categories():
            category_weights[cat] += 3.0

        # 2. Weights from user interaction history
        interactions = db.query(Interaction, Article).join(Article, Interaction.article_id == Article.id).filter(
            Interaction.user_id == user.id
        ).all()

        multipliers = {
            "like": 3.0,
            "save": 2.5,
            "read": 1.0,
            "dislike": -6.0
        }

        for interaction, article in interactions:
            weight = multipliers.get(interaction.interaction_type, 1.0)
            if interaction.interaction_type == "dislike":
                disliked_article_ids.add(article.id)
                category_weights[article.category] = max(-10.0, category_weights[article.category] + weight)
            else:
                category_weights[article.category] += weight
                for tag in article.get_tags():
                    tag_weights[tag.lower()] += weight * 0.8

        return category_weights, tag_weights, disliked_article_ids

    @classmethod
    def score_article(
        cls,
        article: Article,
        category_weights: Dict[str, float],
        tag_weights: Dict[str, float],
        now: datetime.datetime,
        user_has_prefs: bool
    ) -> Tuple[float, str]:
        """
        Calculates ranking score and 'Why this?' explanation for an article.
        Score = (Affinity * 0.45) + (Importance * 0.30) + (Recency * 0.20) + (Exploration * 0.05)
        """
        # 1. Affinity score
        cat_weight = category_weights.get(article.category, 0.0)
        matched_tags = []
        tag_score = 0.0

        for tag in article.get_tags():
            t_low = tag.lower()
            if t_low in tag_weights:
                tag_score += tag_weights[t_low]
                matched_tags.append(tag)

        # Normalize affinity (0 to 10)
        raw_affinity = (cat_weight * 1.5) + (tag_score * 1.2)
        affinity_norm = min(10.0, max(0.0, raw_affinity))

        # 2. Importance score (1 to 10)
        importance_norm = article.importance_score or 5.0

        # 3. Recency score (decay over hours)
        pub_time = article.published_at or article.created_at or now
        age_hours = max(0.0, (now - pub_time).total_seconds() / 3600.0)
        # Half life of 24 hours
        recency_norm = 10.0 * math.exp(-0.028 * age_hours)

        # 4. Exploration / Serendipity factor (0 to 10)
        exploration_norm = random.uniform(2.0, 9.0)

        # Total combined score
        if user_has_prefs:
            total_score = (
                (affinity_norm * 0.45) +
                (importance_norm * 0.25) +
                (recency_norm * 0.20) +
                (exploration_norm * 0.10)
            )
        else:
            # Unauthenticated or fresh user: prioritize high importance + recency
            total_score = (
                (importance_norm * 0.50) +
                (recency_norm * 0.40) +
                (exploration_norm * 0.10)
            )

        # Generate 'Why this?' explanation
        if matched_tags:
            why_this = f"Matches your interest in #{matched_tags[0]}"
        elif cat_weight > 2.0:
            why_this = f"Recommended based on your focus in {article.category}"
        elif importance_norm >= 8.0:
            why_this = f"High-impact global story in {article.category}"
        elif age_hours < 4.0:
            why_this = f"Fresh breaking report from {article.source}"
        else:
            why_this = f"Curated discovery in {article.category}"

        return total_score, why_this

    @classmethod
    def get_for_you_feed(
        cls,
        db: Session,
        user: Optional[User],
        limit: int = 30,
        offset: int = 0
    ) -> List[Tuple[Article, str]]:
        """Returns personalized articles sorted by dynamic composite score."""
        category_weights, tag_weights, disliked_ids = cls.compute_user_profile(db, user)
        user_has_prefs = bool(user and (user.get_preferred_categories() or category_weights))

        now = datetime.datetime.utcnow()
        # Fetch candidate articles from last 7 days
        since = now - datetime.timedelta(days=7)
        candidates = db.query(Article).filter(Article.published_at >= since).order_by(Article.published_at.desc()).limit(250).all()

        if not candidates:
            # Fallback to any latest
            candidates = db.query(Article).order_by(Article.id.desc()).limit(100).all()

        scored_articles = []
        for art in candidates:
            if art.id in disliked_ids:
                continue
            score, why_this = cls.score_article(art, category_weights, tag_weights, now, user_has_prefs)
            scored_articles.append((score, art, why_this))

        scored_articles.sort(key=lambda x: x[0], reverse=True)
        paginated = scored_articles[offset: offset + limit]

        return [(art, why_this) for _, art, why_this in paginated]

    @classmethod
    def get_trending_articles(
        cls,
        db: Session,
        limit: int = 20
    ) -> List[Article]:
        """Returns top trending articles based on importance score and recency."""
        now = datetime.datetime.utcnow()
        since = now - datetime.timedelta(days=3)
        return db.query(Article).filter(
            Article.published_at >= since
        ).order_by(
            Article.importance_score.desc(),
            Article.published_at.desc()
        ).limit(limit).all()


ranking_service = RankingService()
