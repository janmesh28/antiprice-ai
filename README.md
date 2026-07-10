# AntiPrice AI

AntiPrice AI is a startup-ready price intelligence aggregator platform. It tracks, compares, and predicts real-time electronics prices across major e-commerce platforms (Amazon, Flipkart, Croma) and provides AI recommendations, sentiment analysis, and a shopping assistant chatbot.

---

## 🛠️ Project Directory Structure

```
antiprice-ai/
├── backend/               # NestJS Backend API
│   ├── src/
│   │   ├── ai/            # OpenAI Sentiment, Summarization & Chatbot services
│   │   ├── prisma/        # Relational Database connection logic
│   │   ├── products/      # Products CRUD, Recommendations, Price history endpoints
│   │   ├── scraper/       # Playwright Scraper runners (Amazon, Flipkart, Croma) & BullMQ workers
│   │   └── search/        # Elasticsearch indexes and fuzzy search utilities
│   ├── prisma/            # Relational db scheme configuration
│   └── Dockerfile
├── frontend/              # Next.js 16 Web Dashboard UI
│   ├── src/
│   │   ├── app/           # App Router pages and globals
│   │   └── components/    # Recharts Charts, Chatbots, Alert setters, Review cards
│   └── Dockerfile
├── docker-compose.yml     # Local Infrastructure (PostgreSQL, Redis, Elasticsearch)
├── DEPLOYMENT.md          # Production AWS Deployment Guide
└── .github/
    └── workflows/         # GitHub Actions CI/CD workflows template
```

---

## 🚀 Running Locally

### 1. Prerequisites
- **Node.js** v24+ & **npm**
- **Docker Desktop** (for running local databases, caching, and search indices)

### 2. Setup Infrastructure
Start local PostgreSQL, Redis, and Elasticsearch containers:
```bash
docker compose up -d
```

### 3. Initialize NestJS Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Make sure local environment config `.env` exists:
   ```bash
   # Add your actual OpenAI API Key to .env to enable review summaries & chatbot assistant!
   ```
3. Run Prisma migration (maps schema models to your running database):
   ```bash
   npx prisma db push
   ```
4. Start the backend developer service:
   ```bash
   npm run start:dev
   ```
   The backend API will run at `http://localhost:3001`.

### 4. Initialize Next.js Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the frontend developer dashboard:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 💡 AI-Powered Pricing Core Engines

1. **Cheapest Platform Identifier**: Scrapes multiple endpoints in real-time, matching prices, and compiling a **Value Index (0-100)** score.
2. **Review Summaries**: Queries OpenAI models to digest user reviews, separating praises from complaints, and rating product reliability.
3. **Linear Regression Forecasting**: Employs mathematical regressions to project pricing ranges for the next 7 and 30 days, suggesting buying actions.
4. **Fuzzy Search Indexes**: Uses Elasticsearch to run instant, type-tolerant matches over titles and brands.
