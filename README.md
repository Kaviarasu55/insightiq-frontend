# InsightIQ — Frontend

> AI-Powered Data Analytics Platform — React + Vite

## 🔗 Live Demo
[https://insightiqk.netlify.app](https://insightiqk.netlify.app)

## 🧠 What it does
Frontend for InsightIQ — upload any CSV and instantly get AI-powered analysis, visualizations, ML predictions, AutoML model comparison, an AI chatbot, and downloadable PDF reports. No data science knowledge needed.

## ⚙️ Tech Stack
- **React + Vite** — frontend framework
- **Firebase Auth** — Google sign-in authentication
- **Recharts** — data visualizations
- **Axios** — API communication
- **ReactMarkdown** — markdown rendering in chatbot
- **Netlify** — cloud deployment

## 🚀 Features
- Google sign-in via Firebase Auth
- CSV upload with instant AI summary
- Auto-generated charts (bar, histogram, scatter, line)
- Custom chart builder with AI chart type selection
- Multi-turn AI chatbot for data exploration
- ML Prediction — train a model and predict new values
- AutoML — compare 3 models and find the best one
- PDF report export
- Mobile-responsive design
- Active tab auto-centers in navbar on mobile

## 📄 Pages
- **Login** — Google OAuth sign-in
- **Dashboard** — upload CSV, view all datasets
- **Dataset Overview** — AI summary, column analysis, data preview
- **Visualizations** — auto-generated and custom charts
- **Chatbot** — ask questions about your data
- **AutoML** — model comparison
- **ML Prediction** — train and predict
- **Export Report** — download PDF

## 🛠️ Run Locally

```bash
git clone https://github.com/Kaviarasu55/insightiq-frontend
cd insightiq-frontend
npm install
npm run dev
```

Create a `.env` file with:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=https://insightiq-backend-wm3z.onrender.com
```

## 🔗 Backend Repo
[https://github.com/Kaviarasu55/insightiq-backend](https://github.com/Kaviarasu55/insightiq-backend)
