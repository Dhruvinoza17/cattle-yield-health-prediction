from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import pandas as pd
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Calf AI Prediction API", version="1.0")

# Enable CORS so frontend can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL (http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
try:
    with open('yield_model.pkl', 'rb') as f:
        yield_model = pickle.load(f)
    with open('disease_model.pkl', 'rb') as f:
        disease_model = pickle.load(f)
    print("Models loaded successfully.")
except FileNotFoundError:
    print("WARNING: Models not found. API will fail on prediction.")

import google.generativeai as genai

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# --- Data Schemas ---
class CattleInput(BaseModel):
    # Matches features needed by the model pipeline
    Breed: str
    Age: int
    Weight: float
    Lactation_Stage: str
    Parity: int
    Feed_Type: str
    Feed_Quantity: float
    Protein_Content: float
    Walking_Distance: float
    Grazing_Duration: float
    Rumination_Time: float
    Rest_Hours: float
    Body_Temperature: float
    Heart_Rate: float
    Vaccination_Status: str
    Temperature: float
    Humidity: int # Environmental
    Season: str
    Housing_Quality: str

class ChatRequest(BaseModel):
    message: str

# --- Endpoints ---

@app.get("/")
def home():
    return {"message": "Calf AI Backend is running. Use /docs for API documentation."}

@app.post("/chat")
def chat_agent(request: ChatRequest):
    try:
        # Prompt Engineering for context
        prompt = f"""You are an expert Veterinary AI Assistant for a dairy farm app called 'Calf AI'. 
        Your goal is to help farmers with cattle health, yield optimization, and app navigation.
        Be concise, helpful, and professional.
        
        User Query: {request.message}
        """
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"response": f"AI Error: {str(e)}"}

@app.post("/predict-yield")
def predict_yield(data: CattleInput):
    try:
        # Convert input Pydantic model to DataFrame
        input_data = pd.DataFrame([data.dict()])
        
        # Predict
        prediction = yield_model.predict(input_data)[0]
        
        return {
            "predicted_milk_yield_liters": round(prediction, 2),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-disease")
def predict_disease(data: CattleInput):
    try:
        input_data = pd.DataFrame([data.dict()])
        
        # Predict Class and Probability if supported
        prediction = disease_model.predict(input_data)[0]
        probs = disease_model.predict_proba(input_data)[0]
        
        # Build confidence map
        classes = disease_model.classes_
        confidence = {cls: round(prob * 100, 2) for cls, prob in zip(classes, probs)}
        
        return {
            "predicted_condition": prediction,
            "risk_assessment": "High" if prediction != 'Healthy' else "Low",
            "confidence_scores": confidence,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cattle/{animal_id}")
def get_cattle(animal_id: str):
    try:
        df = pd.read_csv('cattle_data.csv')
        record = df[df['Animal_ID'] == animal_id]
        if record.empty:
            raise HTTPException(status_code=404, detail="Cattle not found")
        # Convert to dict
        return record.iloc[0].to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

