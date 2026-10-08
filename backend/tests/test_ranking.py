import datetime
from backend.app.models import Article, User, Interaction
from backend.app.services.ranking_service import RankingService


def test_score_article_high_importance():
    now = datetime.datetime.utcnow()
    article = Article(
        id=1,
        title="Breakthrough in Quantum Computing",
        source="TechSource",
        url="https://example.com/quantum",
        category="Technology",
        importance_score=9.5,
        published_at=now - datetime.timedelta(hours=2),
        tags='["Quantum", "Physics", "Computing"]'
    )

    category_weights = {"Technology": 3.0}
    tag_weights = {"quantum": 2.0}

    score, why_this = RankingService.score_article(
        article=article,
        category_weights=category_weights,
        tag_weights=tag_weights,
        now=now,
        user_has_prefs=True
    )

    assert score > 5.0
    assert "Quantum" in why_this or "Technology" in why_this or "High-impact" in why_this


def test_recency_decay_reduces_score():
    now = datetime.datetime.utcnow()
    fresh_art = Article(
        id=2,
        title="Fresh Story",
        source="Ars",
        url="https://example.com/fresh",
        category="Science",
        importance_score=8.0,
        published_at=now - datetime.timedelta(hours=1),
        tags='["Space"]'
    )
    old_art = Article(
        id=3,
        title="Old Story",
        source="Ars",
        url="https://example.com/old",
        category="Science",
        importance_score=8.0,
        published_at=now - datetime.timedelta(days=6),
        tags='["Space"]'
    )

    category_weights = {}
    tag_weights = {}

    score_fresh, _ = RankingService.score_article(fresh_art, category_weights, tag_weights, now, False)
    score_old, _ = RankingService.score_article(old_art, category_weights, tag_weights, now, False)

    assert score_fresh > score_old
