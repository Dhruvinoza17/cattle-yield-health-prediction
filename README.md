# 🐄 Cattle Yield & Health Prediction AI

A full-stack Hackathon project for optimizing dairy farm productivity using AI.

## 🚀 Features
*   **Yield Prediction:** AI estimates milk production based on feed, breed, and health.
*   **Disease Detection:** ML models assess health risks (Mastitis, Heat Stress, etc.).
*   **My Herd:** A comprehensive, searchable database of your entire cattle inventory.
*   **Real-time Chat Assistant:** "Vet AI" chatbot (Google Gemini) for instant medical advice.
*   **Secure Dashboard:** Firebase Authentication & Firestore for private, real-time data.
*   **Data Entry:** Dual-save system (Cloud + CSV) for training future models.

## 🛠️ Tech Stack
*   **Frontend:** React, Vite, Recharts, Lucide-React, Firebase (Auth/Firestore)
*   **Backend:** Python, FastAPI, Pandas, Scikit-Learn
*   **AI:** Random Forest (Sklearn) + Gemini Pro (GenAI)

---

## 🏃‍♂️ How to Run the Project

You need **two terminal windows** (one for Backend, one for Frontend).

### Terminal 1: Backend (Python API)
```bash
cd backend
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python main.py
```
*   Server runs at: `http://127.0.0.1:8000`
*   Swagger Docs: `http://127.0.0.1:8000/docs`

### Terminal 2: Frontend (React)
```bash
cd frontend
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```
*   Open App at: `http://localhost:5173`

---

## 🔐 Setup Credentials
1.  **Firebase:** Create a `.env` in `frontend/` with your Firebase config (`VITE_FIREBASE_API_KEY`, etc.).
2.  **Gemini AI:** Create a `.env` in `backend/` with `GEMINI_API_KEY`.
3.  **Email (Optional):** Add `MAIL_USERNAME` and `MAIL_PASSWORD` in `backend/.env` for OTP emails.

## 📁 Folder Structure
*   `backend/` - FastAPI server, ML models (`.pkl`), and `cattle_data.csv`.
*   `frontend/` - React application source code.
