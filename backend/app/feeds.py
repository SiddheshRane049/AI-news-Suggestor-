from typing import List, Dict

CATEGORIES_META = {
    "Technology": {
        "icon": "Cpu",
        "description": "Latest in tech, gadgets, silicon, and modern computing",
        "color": "from-cyan-500 to-blue-500"
    },
    "AI & ML": {
        "icon": "BrainCircuit",
        "description": "Deep learning, LLMs, robotics, and foundation models",
        "color": "from-violet-500 to-purple-600"
    },
    "Cybersecurity": {
        "icon": "ShieldAlert",
        "description": "Zero days, malware, network security, and cryptography",
        "color": "from-red-500 to-rose-600"
    },
    "Business & Finance": {
        "icon": "TrendingUp",
        "description": "Markets, macroeconomic trends, banking, and equities",
        "color": "from-emerald-500 to-green-600"
    },
    "Startups": {
        "icon": "Rocket",
        "description": "Venture capital, early stage founders, and product launches",
        "color": "from-amber-500 to-orange-600"
    },
    "Science": {
        "icon": "Atom",
        "description": "Space exploration, physics, biology, and breakthrough discoveries",
        "color": "from-indigo-500 to-sky-600"
    },
    "Health": {
        "icon": "HeartPulse",
        "description": "Medicine, clinical trials, mental wellness, and healthcare tech",
        "color": "from-pink-500 to-rose-500"
    },
    "Sports": {
        "icon": "Trophy",
        "description": "Global tournaments, athletics, football, basketball, and scores",
        "color": "from-orange-500 to-yellow-500"
    },
    "Entertainment": {
        "icon": "Film",
        "description": "Cinema, streaming, pop culture, television, and music",
        "color": "from-purple-500 to-pink-500"
    },
    "World": {
        "icon": "Globe",
        "description": "Geopolitics, international affairs, and global breaking news",
        "color": "from-blue-600 to-teal-500"
    },
    "India": {
        "icon": "Compass",
        "description": "Indian economy, governance, technology, and national news",
        "color": "from-orange-600 to-emerald-600"
    },
    "Politics": {
        "icon": "Landmark",
        "description": "Policy debates, elections, diplomacy, and civic governance",
        "color": "from-slate-600 to-slate-800"
    },
    "Gaming": {
        "icon": "Gamepad2",
        "description": "Esports, console launches, game dev, and interactive media",
        "color": "from-fuchsia-500 to-cyan-500"
    },
    "Education": {
        "icon": "GraduationCap",
        "description": "Edtech, universities, STEM learning, and educational research",
        "color": "from-teal-500 to-cyan-600"
    }
}

RSS_FEEDS: Dict[str, List[Dict[str, str]]] = {
    "Technology": [
        {"name": "The Verge", "url": "https://www.theverge.com/rss/index.xml"},
        {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index"},
        {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"},
        {"name": "Engadget", "url": "https://www.engadget.com/rss.xml"},
        {"name": "Wired Tech", "url": "https://www.wired.com/feed/category/gear/latest/rss"}
    ],
    "AI & ML": [
        {"name": "MIT Tech Review AI", "url": "https://www.technologyreview.com/topic/artificial-intelligence/feed"},
        {"name": "VentureBeat AI", "url": "https://venturebeat.com/category/ai/feed/"},
        {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/"},
        {"name": "MarkTechPost", "url": "https://www.marktechpost.com/feed/"},
        {"name": "Synced Review", "url": "https://syncedreview.com/feed/"}
    ],
    "Cybersecurity": [
        {"name": "The Hacker News", "url": "https://feeds.feedburner.com/TheHackersNews"},
        {"name": "BleepingComputer", "url": "https://www.bleepingcomputer.com/feed/"},
        {"name": "SecurityWeek", "url": "https://www.securityweek.com/feed/"},
        {"name": "Krebs on Security", "url": "https://krebsonsecurity.com/feed/"},
        {"name": "Dark Reading", "url": "https://www.darkreading.com/rss.xml"}
    ],
    "Business & Finance": [
        {"name": "CNBC Finance", "url": "https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=finance&sort=date&format=xml"},
        {"name": "WSJ Markets", "url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml"},
        {"name": "MarketWatch", "url": "https://feeds.content.dowjones.io/public/rss/mw_topstories"},
        {"name": "Fortune", "url": "https://fortune.com/feed/"},
        {"name": "Financial Times World", "url": "https://www.ft.com/world?format=rss"}
    ],
    "Startups": [
        {"name": "TechCrunch Startups", "url": "https://techcrunch.com/category/startups/feed/"},
        {"name": "EU-Startups", "url": "https://www.eu-startups.com/feed/"},
        {"name": "StartupBeat", "url": "https://startupbeat.com/feed/"},
        {"name": "VentureBeat", "url": "https://venturebeat.com/feed/"},
        {"name": "Sifted", "url": "https://sifted.eu/feed"}
    ],
    "Science": [
        {"name": "ScienceDaily", "url": "https://www.sciencedaily.com/rss/all.xml"},
        {"name": "Nature Latest", "url": "https://www.nature.com/nature.rss"},
        {"name": "Phys.org", "url": "https://phys.org/rss-feed/"},
        {"name": "New Scientist", "url": "https://www.newscientist.com/section/news/feed/"},
        {"name": "Scientific American", "url": "https://www.scientificamerican.com/feed/rss/"}
    ],
    "Health": [
        {"name": "Medical News Today", "url": "https://rss.medicalnewstoday.com/featurednews.xml"},
        {"name": "ScienceDaily Health", "url": "https://www.sciencedaily.com/rss/health_medicine.xml"},
        {"name": "STAT News", "url": "https://www.statnews.com/feed/"},
        {"name": "WHO News", "url": "https://www.who.int/rss-feeds/news-english.xml"},
        {"name": "Harvard Health", "url": "https://www.health.harvard.edu/blog/feed"}
    ],
    "Sports": [
        {"name": "ESPN Top News", "url": "https://www.espn.com/espn/rss/news"},
        {"name": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml"},
        {"name": "Yahoo Sports", "url": "https://sports.yahoo.com/rss/"},
        {"name": "Sky Sports", "url": "https://www.skysports.com/rss/12040"},
        {"name": "The Athletic RSS", "url": "https://theathletic.com/rss-feed/"}
    ],
    "Entertainment": [
        {"name": "Variety", "url": "https://variety.com/feed/"},
        {"name": "The Hollywood Reporter", "url": "https://www.hollywoodreporter.com/feed/"},
        {"name": "Rolling Stone", "url": "https://www.rollingstone.com/feed/"},
        {"name": "Deadline", "url": "https://deadline.com/feed/"},
        {"name": "Pitchfork", "url": "https://pitchfork.com/feed/feed-news/rss"}
    ],
    "World": [
        {"name": "BBC World News", "url": "https://feeds.bbci.co.uk/news/world/rss.xml"},
        {"name": "Reuters World", "url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best"},
        {"name": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml"},
        {"name": "DW World News", "url": "https://rss.dw.com/rdf/rss-en-all"},
        {"name": "NPR World", "url": "https://feeds.npr.org/1004/rss.xml"}
    ],
    "India": [
        {"name": "NDTV India News", "url": "https://feeds.feedburner.com/ndtvnews-india-news"},
        {"name": "The Hindu National", "url": "https://www.thehindu.com/news/national/feeder/default.rss"},
        {"name": "Times of India", "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"},
        {"name": "Indian Express", "url": "https://indianexpress.com/section/india/feed/"},
        {"name": "Livemint", "url": "https://www.livemint.com/rss/news"}
    ],
    "Politics": [
        {"name": "Politico", "url": "https://rss.politico.com/politics-news.xml"},
        {"name": "The Hill", "url": "https://thehill.com/feed/"},
        {"name": "BBC Politics", "url": "https://feeds.bbci.co.uk/news/politics/rss.xml"},
        {"name": "NPR Politics", "url": "https://feeds.npr.org/1014/rss.xml"},
        {"name": "Reuters Politics", "url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=politics"}
    ],
    "Gaming": [
        {"name": "IGN", "url": "https://feeds.feedburner.com/ign/all"},
        {"name": "Kotaku", "url": "https://kotaku.com/rss"},
        {"name": "Polygon", "url": "https://www.polygon.com/rss/index.xml"},
        {"name": "PC Gamer", "url": "https://www.pcgamer.com/rss/"},
        {"name": "Eurogamer", "url": "https://www.eurogamer.net/?format=rss"}
    ],
    "Education": [
        {"name": "EdSurge", "url": "https://www.edsurge.com/articles_rss"},
        {"name": "Inside Higher Ed", "url": "https://www.insidehighered.com/feed/news"},
        {"name": "Chronicle of Higher Education", "url": "https://www.chronicle.com/rss"},
        {"name": "eSchool News", "url": "https://www.eschoolnews.com/feed/"},
        {"name": "MIT News Education", "url": "https://news.mit.edu/rss/topic/education"}
    ]
}
