# AgriSense — Complete Setup Guide

## 🚀 Quick Start (Windows)

1. Double-click **`start.bat`** in the `agrisense/` folder
2. Wait for both servers to start (~30 seconds first run)
3. Browser opens automatically at `http://localhost:3000`

---

## 🔑 Step-by-Step: Get Your Google Client ID

You need a Google Client ID to enable "Sign in with Google".

### Step 1 — Go to Google Cloud Console

1. Open your browser and go to:
   👉 **https://console.cloud.google.com/**

2. Sign in with your Google account.

---

### Step 2 — Create a New Project

1. Click the **project dropdown** at the top (next to "Google Cloud" logo)
2. Click **"New Project"**
3. Enter project name: `AgriSense`
4. Click **"Create"**
5. Wait a few seconds, then select the new project from the dropdown

---

### Step 3 — Enable the Google OAuth API

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on **"Google+ API"** → Click **"Enable"**

---

### Step 4 — Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **"External"** → Click **"Create"**
3. Fill in the required fields:
   - **App name**: `AgriSense`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **"Save and Continue"**
5. On the **Scopes** page → Click **"Save and Continue"** (no changes needed)
6. On the **Test users** page → Add your own email as a test user → Click **"Save and Continue"**
7. Click **"Back to Dashboard"**

---

### Step 5 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials"** → Select **"OAuth client ID"**
3. For **Application type**, select **"Web application"**
4. Set **Name**: `AgriSense Web Client`
5. Under **Authorized JavaScript origins**, click **"+ Add URI"**:
   ```
   http://localhost:3000
   ```
6. Under **Authorized redirect URIs**, click **"+ Add URI"** and add:
   ```
   http://localhost:8000/api/auth/google/callback
   ```
7. Click **"Create"**

---

### Step 6 — Copy Your Credentials

A popup will show your credentials:

```
Client ID:     xxxxxxxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxx
```

**Copy both values** — you'll need them in the next step.

---

### Step 7 — Add to Your .env Files

#### Backend (`agrisense/backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/agrisense
SECRET_KEY=agrisense-super-secret-key-change-this-in-production-32chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OPENWEATHER_API_KEY=your_openweather_key_here
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`agrisense/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

---

## 🌤️ Get OpenWeatherMap API Key (Free)

1. Go to 👉 **https://openweathermap.org/api**
2. Click **"Sign Up"** (free account)
3. After signup, go to **"My API Keys"** tab
4. Copy your default API key (or create a new one)
5. Paste it in `backend/.env` as `OPENWEATHER_API_KEY`

> **Note:** New API keys take up to 2 hours to activate.
> The app works without it using mock weather data.

---

## 🗄️ Database Setup (Neon DB — Free PostgreSQL)

### Option A: Neon DB (Recommended — Free Cloud PostgreSQL)

1. Go to 👉 **https://neon.tech/**
2. Sign up for a free account
3. Click **"New Project"** → Name it `agrisense`
4. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Paste it in `backend/.env` as `DATABASE_URL`

### Option B: Local PostgreSQL

1. Install PostgreSQL from **https://www.postgresql.org/download/**
2. Create a database:
   ```sql
   CREATE DATABASE agrisense;
   CREATE USER agrisense_user WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE agrisense TO agrisense_user;
   ```
3. Set in `.env`:
   ```env
   DATABASE_URL=postgresql://agrisense_user:yourpassword@localhost:5432/agrisense
   ```

---

## 📦 Manual Setup (Without start.bat)

### Backend

```bash
cd agrisense/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment file
copy .env.example .env
# Edit .env with your keys

# Train ML models
python scripts/train_models.py

# Seed database
python scripts/seed_data.py

# Start server
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
API Docs at: **http://localhost:8000/docs**

### Frontend

```bash
cd agrisense/frontend

# Install packages
npm install

# Create env file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🧪 Run Tests

```bash
cd agrisense/backend
venv\Scripts\activate
pytest tests/ -v
```

---

## 📊 Import AGMARKNET Market Data

1. Go to 👉 **https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi**
2. Click **"Export in CSV"**
3. Fill in the purpose form and download the CSV
4. In the app, go to the API docs at `http://localhost:8000/docs`
5. Use the **POST /api/market/import-csv** endpoint to upload the CSV

---

## 🐳 Docker Setup (Optional)

```bash
cd agrisense

# Copy env files first
copy backend\.env.example backend\.env
# Edit backend\.env with your keys

# Build and start
docker-compose up --build
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| `python not found` | Install Python 3.11+ and add to PATH |
| `node not found` | Install Node.js 18+ from nodejs.org |
| `Database connection failed` | Check DATABASE_URL in .env |
| `ML models not found` | Run `python scripts/train_models.py` |
| `Google OAuth not working` | Check GOOGLE_CLIENT_ID and redirect URIs |
| `Weather data unavailable` | App uses mock data — add OPENWEATHER_API_KEY |
| Port 8000 already in use | Kill existing process or change port in start.bat |
| Port 3000 already in use | Kill existing process or run `npm run dev -- -p 3001` |

---

## 📁 Project Structure

```
agrisense/
├── start.bat              ← Double-click to start everything!
├── SETUP_GUIDE.md         ← This file
├── docker-compose.yml
├── backend/
│   ├── .env.example       ← Copy to .env and fill in keys
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py        ← FastAPI entry point
│   │   ├── models/        ← Database models
│   │   ├── routers/       ← API endpoints
│   │   └── services/      ← Business logic + ML
│   └── scripts/
│       ├── train_models.py ← Run once to train ML
│       └── seed_data.py    ← Run once to seed DB
└── frontend/
    ├── .env.local          ← Created by start.bat
    └── app/               ← Next.js pages
```

---

*Built for HackIndia 🇮🇳 | AgriSense — Fasal Ka Sahi Faisla, AI Se*
