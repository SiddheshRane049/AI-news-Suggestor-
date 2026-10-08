import json
import logging
import time
import re
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI
from backend.app.config import settings
from backend.app.schemas import ArticleAIAnalysis

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self._client: Optional[OpenAI] = None

    @property
    def client(self) -> Optional[OpenAI]:
        if not settings.is_nvidia_configured:
            return None
        if self._client is None:
            self._client = OpenAI(
                base_url=settings.NVIDIA_BASE_URL,
                api_key=settings.NVIDIA_API_KEY
            )
        return self._client

    def _clean_output(self, text: str) -> str:
        """Removes <think>...</think> reasoning blocks if present."""
        if not text:
            return ""
        # Remove <think>...</think>
        cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
        # Remove "Here's a thinking process: ... \n\n"
        cleaned = re.sub(r"^Here's a thinking process:[\s\S]*?\n\n", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    def _call_with_retry(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024,
        max_retries: int = 3
    ) -> str:
        """Executes LLM request with exponential backoff on 429/5xx errors."""
        client = self.client
        if not client:
            raise ValueError("NVIDIA_API_KEY is not configured or using default placeholder.")

        backoff = 1.0
        last_exception = None
        models_to_try = [
            settings.NVIDIA_MODEL,
            "nvidia/nemotron-3.5-lightning-30b-a3b",
            "nvidia/llama-3.1-nemotron-70b-instruct"
        ]
        # Remove duplicates while preserving order
        unique_models = []
        for m in models_to_try:
            if m and m not in unique_models:
                unique_models.append(m)

        for model_name in unique_models:
            for attempt in range(max_retries):
                try:
                    time.sleep(0.3)
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    content = response.choices[0].message.content or ""
                    return self._clean_output(content)
                except Exception as e:
                    last_exception = e
                    err_str = str(e).lower()
                    if "410" in err_str or "not found" in err_str or "deprecated" in err_str or "no longer available" in err_str:
                        logger.warning(f"Model '{model_name}' unavailable ({e}). Trying next active model...")
                        break  # try next model in outer loop
                    elif "429" in err_str or "rate limit" in err_str or "500" in err_str or "503" in err_str or "504" in err_str:
                        logger.warning(f"LLM API rate limit or server error ({attempt+1}/{max_retries}): {e}. Backing off {backoff}s...")
                        time.sleep(backoff)
                        backoff *= 2.0
                    else:
                        logger.error(f"LLM call error: {e}")
                        break

        raise last_exception or RuntimeError("LLM request failed after retries")


    def _extract_json(self, raw_text: str) -> Dict[str, Any]:
        """Extracts JSON dictionary even if wrapped in markdown code blocks or conversational text."""
        raw_text = raw_text.strip()
        # Look for ```json ... ``` blocks
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            return json.loads(candidate)

        # Look for { ... } object
        match = re.search(r"(\{[\s\S]*\})", raw_text)
        if match:
            return json.loads(match.group(1))

        return json.loads(raw_text)

    def analyze_article(
        self,
        title: str,
        source: str,
        text: str,
        category: str
    ) -> ArticleAIAnalysis:
        """
        Analyzes an article: returns strict JSON parsed into ArticleAIAnalysis.
        Retries once with 'fix your JSON' prompt if JSON parsing fails.
        """
        if not settings.is_nvidia_configured:
            return self._heuristic_fallback_analysis(title, source, text, category)

        content_sample = (text or title)[:3000]

        system_prompt = (
            "You are an expert news analyst and editor. "
            "Analyze the given news article and output ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "summary": "2-3 sentences concise executive summary",\n'
            '  "key_points": ["point 1", "point 2", "point 3", "point 4"],\n'
            '  "sentiment": "Positive" | "Negative" | "Neutral",\n'
            '  "tags": ["tag1", "tag2", "tag3", "tag4"],\n'
            '  "reading_time": integer_in_minutes_1_to_15,\n'
            '  "importance_score": float_between_1_and_10\n'
            "}\n"
            "Do not output markdown explanations or any text outside the JSON."
        )

        user_prompt = f"Category: {category}\nSource: {source}\nTitle: {title}\n\nArticle Content:\n{content_sample}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw_output = ""
        try:
            raw_output = self._call_with_retry(messages, temperature=0.1)
            parsed_json = self._extract_json(raw_output)
            return ArticleAIAnalysis(**parsed_json)
        except Exception as first_err:
            logger.warning(f"Initial JSON parse failed for '{title}': {first_err}. Attempting recovery prompt...")
            # Retry once with fix prompt
            recovery_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": raw_output},
                {"role": "user", "content": "Your previous response was not valid JSON or failed schema validation. Fix your JSON and return ONLY the raw JSON object."}
            ]
            try:
                fixed_output = self._call_with_retry(recovery_messages, temperature=0.0)
                parsed_json = self._extract_json(fixed_output)
                return ArticleAIAnalysis(**parsed_json)
            except Exception as second_err:
                logger.error(f"Recovery LLM parsing also failed for '{title}': {second_err}. Falling back to heuristic extraction.")
                return self._heuristic_fallback_analysis(title, source, text, category)

    def _heuristic_fallback_analysis(
        self,
        title: str,
        source: str,
        text: str,
        category: str
    ) -> ArticleAIAnalysis:
        """Graceful heuristic fallback when LLM is offline, unconfigured, or fails."""
        clean_text = (text or title).strip()
        sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', clean_text) if len(s.strip()) > 15]

        # 2-3 sentences summary
        summary = " ".join(sentences[:3]) if sentences else title
        if len(summary) < 20:
            summary = f"{title}. Reported by {source} under {category}."

        # 3-5 key points
        key_points = sentences[1:5] if len(sentences) >= 4 else [
            f"Coverage of {title} published by {source}.",
            f"Categorized under {category} news updates.",
            "Full details available via the original article link."
        ]

        # Sentiment heuristic
        lower = (title + " " + clean_text[:500]).lower()
        pos_words = ["breakthrough", "growth", "record", "success", "innovative", "gain", "win", "rally", "promising", "positive"]
        neg_words = ["crisis", "crash", "fall", "breach", "hack", "loss", "warning", "threat", "lawsuit", "decline", "killed"]
        pos_count = sum(1 for w in pos_words if w in lower)
        neg_count = sum(1 for w in neg_words if w in lower)

        if pos_count > neg_count:
            sentiment = "Positive"
        elif neg_count > pos_count:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        # Tags extraction
        words = re.findall(r'[A-Za-z0-9\-]{4,}', title)
        stop_words = {"this", "that", "with", "from", "have", "more", "will", "what", "news", "report", "says", "after", "about"}
        custom_tags = [w.capitalize() for w in words if w.lower() not in stop_words][:4]
        if category not in custom_tags:
            custom_tags.insert(0, category)
        tags = custom_tags[:5]

        # Reading time
        word_count = len(clean_text.split())
        reading_time = max(1, min(12, word_count // 180 or 2))

        importance = 6.5
        if any(w in lower for w in ["breaking", "major", "historic", "critical", "billion", "launch"]):
            importance = 8.5

        return ArticleAIAnalysis(
            summary=summary,
            key_points=key_points[:5],
            sentiment=sentiment,
            tags=tags,
            reading_time=reading_time,
            importance_score=importance
        )

    def chat_with_article(
        self,
        article_title: str,
        article_text: str,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Answers user question specifically grounded in one article."""
        if not settings.is_nvidia_configured:
            return f"AI Chat Assistant (Offline mode: configure NVIDIA_API_KEY in backend/.env to activate live LLM).\n\nRegarding **{article_title}**: Based on the article summary and key points, this piece covers developments in this topic. Ask anything once your API key is connected!"

        system_prompt = (
            f"You are an insightful AI research assistant. You are answering questions about the following article:\n"
            f"TITLE: {article_title}\n"
            f"CONTENT:\n{(article_text or article_title)[:4000]}\n\n"
            f"Instructions:\n"
            f"1. Answer concisely, clearly, and directly based on the article's contents.\n"
            f"2. If the answer is not in the article, state that clearly and provide helpful context.\n"
            f"3. Use clean markdown formatting with bullet points and bold highlights where appropriate."
        )

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for item in history[-6:]:  # Keep recent context
                messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
        messages.append({"role": "user", "content": message})

        try:
            return self._call_with_retry(messages, temperature=0.3, max_tokens=800)
        except Exception as e:
            logger.error(f"Chat with article error: {e}")
            return f"I encountered an error connecting to the AI model: {e}. Please check your NVIDIA API key."

    def chat_with_daily_news(
        self,
        user_query: str,
        relevant_articles: List[Dict[str, Any]],
        history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Grounded Q&A across today's stored articles.
        Returns AI answer + citations / source links.
        """
        if not relevant_articles:
            return "I don't have enough articles stored for that topic yet. Try refreshing the news feed or asking about current top categories!", []

        sources_context = ""
        citation_sources = []
        for i, art in enumerate(relevant_articles[:6], start=1):
            sources_context += f"[{i}] {art.get('title')} (Source: {art.get('source')}, Category: {art.get('category')})\nSummary: {art.get('summary') or art.get('title')}\nURL: {art.get('url')}\n\n"
            citation_sources.append({
                "index": i,
                "id": art.get("id"),
                "title": art.get("title"),
                "source": art.get("source"),
                "url": art.get("url"),
                "category": art.get("category")
            })

        if not settings.is_nvidia_configured:
            reply = f"Here are the top stories matching your query '{user_query}':\n"
            for src in citation_sources:
                reply += f"- **{src['title']}** ({src['source']})\n"
            reply += "\n*(Configure your NVIDIA_API_KEY in backend/.env for comprehensive conversational synthesis!)*"
            return reply, citation_sources

        system_prompt = (
            "You are an AI News Analyst. Answer the user's question using ONLY the news articles provided below. "
            "Cite your sources using bracketed numbers like [1], [2] corresponding to the articles.\n"
            "Do not hallucinate news events not present in the provided articles.\n\n"
            f"ARTICLES CONTEXT:\n{sources_context}"
        )

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for item in history[-6:]:
                messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
        messages.append({"role": "user", "content": user_query})

        try:
            reply = self._call_with_retry(messages, temperature=0.3, max_tokens=1000)
            return reply, citation_sources
        except Exception as e:
            logger.error(f"Chat with news error: {e}")
            return f"Error analyzing news: {e}", citation_sources

    def generate_daily_intro(
        self,
        top_articles: List[Dict[str, Any]],
        user_name: Optional[str] = None,
        preferred_categories: Optional[List[str]] = None
    ) -> str:
        """Generates a compelling daily briefing introduction."""
        greeting_name = user_name or "there"
        cats_str = ", ".join(preferred_categories) if preferred_categories else "all categories"

        if not top_articles:
            return f"Good day, {greeting_name}! Welcome to your daily briefing. Stay tuned as we fetch the latest stories in {cats_str}."

        if not settings.is_nvidia_configured:
            return (
                f"Good day, {greeting_name}! Here is your personalized daily briefing covering top stories in {cats_str}. "
                f"We've curated {len(top_articles)} significant developments across the globe today."
            )

        headlines_summary = "\n".join([f"- {a.get('title')} ({a.get('category')})" for a in top_articles[:8]])

        system_prompt = (
            "You are an executive news anchor and editor. Write an engaging, high-energy 2-paragraph morning briefing intro "
            f"for {greeting_name}. Highlight the overarching themes across these top stories:\n"
            f"{headlines_summary}\n"
            "Keep it under 120 words, crisp, inspiring, and professional."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Generate the daily briefing intro."}
        ]

        try:
            return self._call_with_retry(messages, temperature=0.5, max_tokens=300)
        except Exception as e:
            logger.warning(f"Error generating daily intro: {e}")
            return f"Good day, {greeting_name}! Here is your intelligence briefing on today's top stories in {cats_str}."

    def explain_simply(self, title: str, summary_or_text: str) -> Dict[str, str]:
        """Generates an ELI5 (Explain Like I'm 5) breakdown with a clear metaphor."""
        if not settings.is_nvidia_configured:
            return {
                "simplified_explanation": f"Simply put: {summary_or_text[:250]}... In plain words, this is an important update about {title}.",
                "key_metaphor": "Think of it like upgrading an engine in a car while driving smoothly on the highway."
            }

        prompt = (
            f"Explain the following news story in simple terms (ELI5 style - clear, jargon-free, accessible to anyone) "
            f"and provide an intuitive analogy/metaphor.\n\n"
            f"STORY TITLE: {title}\n"
            f"DETAILS:\n{(summary_or_text or title)[:2000]}\n\n"
            f"Return ONLY a valid JSON object:\n"
            '{\n  "simplified_explanation": "2-3 simple sentences",\n  "key_metaphor": "One memorable analogy"\n}'
        )

        messages = [
            {"role": "system", "content": "You are a master educator who explains complex technical, financial, and global news in simple terms."},
            {"role": "user", "content": prompt}
        ]

        try:
            raw = self._call_with_retry(messages, temperature=0.4, max_tokens=400)
            data = self._extract_json(raw)
            return {
                "simplified_explanation": data.get("simplified_explanation", summary_or_text[:200]),
                "key_metaphor": data.get("key_metaphor", "Think of it as a significant shift in how people connect and build.")
            }
        except Exception as e:
            logger.warning(f"Explain simply failed: {e}")
            return {
                "simplified_explanation": f"In simple terms: {summary_or_text[:200]}.",
                "key_metaphor": "A fresh step forward in this field."
            }


llm_service = LLMService()
