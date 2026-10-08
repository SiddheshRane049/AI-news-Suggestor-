# 🌟 AI News Suggestor

An AI-curated news engine powered by **NVIDIA NIM hosted LLMs** (Llama 3.3 70B Instruct). It pulls live multi-category RSS feeds, extracts and dedupes stories, generates 2-3 sentence summaries, key takeaways, sentiment scores, and topic tags, and personalizes a real-time **"For You"** stream based on user interactions.

---

## 🚀 Quick Setup & Run

### Step 1: Configure your NVIDIA API Key
Open [backend/.env](file:///backend/.env#L1) (Line 1):
```ini
NVIDIA_API_KEY=PASTE_YOUR_KEY_HERE
```
Replace `PASTE_YOUR_KEY_HERE` with your NVIDIA NIM API key (obtained free at [build.nvidia.com](https://build.nvidia.com)).

---

### Step 2: One-Click Run

#### On Windows:
Double click or run:
```cmd
run.bat
```

#### On macOS / Linux:
```bash
chmod +x run.sh
./run.sh
```

#### Or with Docker Compose:
```bash
docker-compose up --build
```

---

### Step 3: Access the Application
- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 💎 Features & Capabilities

1. **Autonomous Ingestion & Multi-Source RSS Feeds:**
   - 14 distinct categories (Technology, AI & ML, Cybersecurity, Business, Startups, Science, Health, Sports, Entertainment, World, India, Politics, Gaming, Education).
   - Real-time deduplication via URL hashing & fuzzy title matching (`difflib.SequenceMatcher`).
   - Clean article text extraction via `trafilatura` & `BeautifulSoup`.
   - Scheduled auto-refresh using `APScheduler`.

2. **NVIDIA NIM LLM Intelligence:**
   - Provider: Official OpenAI Python SDK connected to `https://integrate.api.nvidia.com/v1`.
   - Model: `meta/llama-3.3-70b-instruct`.
   - Strict JSON schema enforcement with Pydantic validation and auto-healing prompt retry.
   - Summarization, 3-5 key takeaways, sentiment analysis, topic tagging, reading time, and importance score (1-10).
   - Zero redundant processing with database caching.

3. **Hyper-Personalized "For You" Feed:**
   - Dynamic affinity weights computed from user likes (+3), saves (+2.5), reads (+1), and dislikes (-6).
   - Composite scoring: `(Affinity × 0.45) + (Importance × 0.25) + (Recency Decay × 0.20) + (Exploration × 0.10)`.
   - Transparent **"Why this?"** explanation badge on every card.

4. **Grounded News AI & Article Assistant:**
   - **"Chat with Today's News"**: Conversational copilot grounded exclusively in stored news items with bracketed source citations.
   - **"Ask AI about this article"**: Deep-dive Q&A drawer for any specific story.
   - **"Explain Simply (ELI5)"**: Generates intuitive explanations and memorable metaphors.

5. **Modern UI/UX:**
   - Bento-Grid spotlight layout for top breaking stories.
   - Global Command Palette (`Ctrl+K` / `Cmd+K`).
   - Built-in Text-To-Speech (TTS) voice narrator for executive summaries.
   - Export saved bookmarks to Markdown (`.md`).
   - Light & Dark mode glassmorphism theme with neon violet/cyan gradients.
   - Full Admin & Health Telemetry dashboard with live ingestion logs.

---

## 🧪 Running Tests

To run the automated pytest test suite for ranking and LLM JSON parsing:
```bash
python -m pytest backend/tests/
```
