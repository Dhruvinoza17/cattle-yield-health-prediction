# 🐮 Calf AI - Project Documentation & Judges Guide

## 🚀 Project Overview
**Calf AI** is an intelligent, secure dairy farm management platform designed to optimize milk yield and ensure cattle health through machine learning and real-time analytics. It modernizes traditional farming by combining **predictive AI**, **secure cloud storage**, and **generative AI assistance**.

### The Problem
Traditional dairy farming relies on manual observation and disconnected data, leading to:
- **Delayed Disease Detection:** Mastitis and Heat Stress often go unnoticed until it's too late.
- **Data Fragmentation:** Critical records live in notebooks or isolated spreadsheets.
- **Lack of Actionable Advice:** Farmers know *what* is happening, but not *what to do*.

### The Solution
Calf AI bridges this gap with a unified, secure dashboard:
- **Yield Prediction:** Forecasts milk output using Random Forest Regression.
- **Disease Risk Detection:** Identifies health risks (Mastitis, Heat Stress) with ~93% accuracy.
- **My Herd:** A searchable, real-time database of all cattle with instant AI veterinary support.
- **Generative AI Vet:** A built-in chatbot (powered by Gemini) to answer specific health questions.

---

## 📱 Key Features & Pages

### 1. Dashboard (`/`)
*   **Mission Control:** A real-time overview of the entire farm.
*   **Key Features:**
    *   **Live Stats:** Total Cattle, Daily Yield Estimates, and High Risk Alerts.
    *   **Interactive Graphs:** Milk Production Trends, Disease Distribution, and Yield Buckets.
    *   **Demo Mode:** One-click "Load Demo Data" to visualize potential insights instantly.
    *   **Tech:** Uses **Firebase Firestore** real-time listeners (`onSnapshot`) for instant updates.

### 2. My Herd (`/predictions`)
*   **Formerly "Health & Yield":** The central registry for your cattle.
*   **Key Features:**
    *   **Searchable Grid:** Filter 100s of animals by ID, Breed, or Health Status instantly.
    *   **Risk Indicators:** Color-coded cards (Red/Green) highlight animals needing attention.
    *   **Detail View:** Deep dive into specific animal metrics (Age, Weight, Feed).
    *   **AI Chat Integration:** Click the "Chat" button on any high-risk animal to get immediate, context-aware veterinary advice.

### 3. Data Entry (`/data-entry`)
*   **Input Interface:** Streamlined form for logging new daily scans.
*   **Smart Storage:**
    *   **Cloud:** Saves to **Firebase Firestore** for the user's private dashboard.
    *   **Training:** Saves to a local CSV dataset to continuously improve the ML models.

### 4. Reports (`/reports`)
*   **Compliance:** Digital logbook for historic tracking.
*   **Key Features:**
    *   **Sortable History:** View every scan ever recorded.
    *   **PDF Export:** Generate professional, printer-friendly reports for vet visits or audits.

### 5. Authentication & Security (`/auth`)
*   **Secure Access:** Multi-factor style authentication.
    *   **Signup/Login:** Secure email/password flows.
    *   **OTP Verification:** Email-based One-Time Password verification for new accounts.
    *   **Data Isolation:** Every user sees *only* their own cattle data (enforced by Firestore rules).

---

## 🛠️ Technology Stack

### Frontend (The Face)
*   **Framework:** React 18 + Vite.
*   **Styling:** Custom CSS with a "Premium Earthy" palette.
*   **Real-time Database:** Firebase Firestore.
*   **Auth:** Firebase Authentication.
*   **Visualization:** Recharts for dynamic analytics.
*   **AI Integration:** Google Gemini API (for Chat).

### Backend (The Brain)
*   **Framework:** FastAPI (Python).
*   **Machine Learning:**
    *   **Scikit-Learn:** Random Forest Regressor (Yield) & Classifier (Disease).
    *   **XGBoost:** (Experimental) Gradient boosting for enhanced accuracy.
*   **Logic:** Pydantic for strict data validation.
*   **Persistence:** Pandas for CSV dataset management.

---

## 🧠 AI & ML Integration
1.  **Orchestration:** When a user submits data, the Frontend sends it to the **FastAPI Backend**.
2.  **Inference:**
    *   The backend loads pre-trained `.pkl` models.
    *   It predicts **Milk Yield (Liters)** and **Health Condition**.
    *   It calculates a **Risk Score** and **Confidence Level**.
3.  **GenAI Context:** If a risk is detected, the frontend allows the user to click "Chat".
    *   The specific animal's data (ID, Condition, Yield) is injected into a **Gemini Prompt**.
    *   The LLM acts as a specialized vet to recommend treatment.

---

## 🎤 Q&A: Anticipating Judges' Questions

**Q: How is this different from a spreadsheet?**
**A:** Spreadsheets are passive; Calf AI is **proactive**. It alerts you to risks *before* they spread, visualizes trends instantly, and provides a virtual vet assistant (Gemini) to guide your decisions.

**Q: Is the data secure?**
**A:** Yes. We use **Firebase Authentication** and **Firestore** security rules. Each farmer has a unique ID, and they can only access the `users/{userId}/cattle_records` collection. No one else can see their farm's data.

**Q: How does the AI Chat work?**
**A:** We use the Google Gemini API. When you ask about a specific cow, we construct a prompt like: *"My cow [ID] has [Disease]. What should I do?"*. This ensures the AI gives specific, relevant medical advice rather than generic answers.

**Q: What if I have no internet?**
**A:** Currently, the app requires internet for Cloud Sync and AI. However, we have a "Download CSV/PDF" feature to keep offline records, and the PWA capability is on our roadmap.

---

## 🏆 Innovation Factor
We combined **Hard ML** (Predictive Models) with **Soft AI** (Generative Chat) and wrapped it in a **Consumer-Grade UI**. Most AgTech is clunky; Calf AI feels like a modern SaaS product, making advanced technology accessible to every farmer.
