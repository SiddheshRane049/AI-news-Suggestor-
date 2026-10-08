import json
import pytest
from unittest.mock import MagicMock, patch
from backend.app.services.llm_service import LLMService
from backend.app.schemas import ArticleAIAnalysis


def test_extract_json_from_markdown():
    service = LLMService()
    raw_markdown = """
    Here is the analysis:
    ```json
    {
        "summary": "This is a 2-sentence summary of the news. Major implications for technology.",
        "key_points": ["First point", "Second point", "Third point"],
        "sentiment": "Positive",
        "tags": ["AI", "Hardware", "Semiconductor"],
        "reading_time": 4,
        "importance_score": 8.5
    }
    ```
    Hope this helps!
    """

    data = service._extract_json(raw_markdown)
    assert data["sentiment"] == "Positive"
    assert data["importance_score"] == 8.5
    assert len(data["key_points"]) == 3

    analysis = ArticleAIAnalysis(**data)
    assert analysis.reading_time == 4


def test_heuristic_fallback_when_offline():
    service = LLMService()
    analysis = service._heuristic_fallback_analysis(
        title="NVIDIA Unveils Next-Gen AI Silicon with Record Performance",
        source="TechCrunch",
        text="NVIDIA has announced its next generation computing architecture designed for frontier AI models. The new chips deliver significant throughput gains.",
        category="AI & ML"
    )

    assert analysis.sentiment == "Positive"
    assert len(analysis.key_points) >= 3
    assert analysis.importance_score > 6.0
    assert "AI & ML" in analysis.tags or "Nvidia" in analysis.tags


def test_analyze_article_with_mocked_openai():
    service = LLMService()

    fake_response = MagicMock()
    fake_choice = MagicMock()
    fake_choice.message.content = json.dumps({
        "summary": "OpenAI and NVIDIA announce joint computing initiative.",
        "key_points": ["Accelerates compute", "New cluster architecture", "Available next quarter"],
        "sentiment": "Positive",
        "tags": ["AI", "NVIDIA", "Compute"],
        "reading_time": 3,
        "importance_score": 9.0
    })
    fake_response.choices = [fake_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = fake_response

    with patch.object(LLMService, "client", new_callable=lambda: property(lambda self: mock_client)), \
         patch("backend.app.config.Settings.is_nvidia_configured", new_callable=lambda: property(lambda self: True)):
        result = service.analyze_article(
            title="OpenAI and NVIDIA Announce Initiative",
            source="Reuters",
            text="Detailed news text here...",
            category="Technology"
        )

        assert result.summary == "OpenAI and NVIDIA announce joint computing initiative."
        assert result.sentiment == "Positive"
        assert result.importance_score == 9.0

