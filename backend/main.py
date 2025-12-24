from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
import pickle
import pandas as pd
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import secrets
import os

app = FastAPI(title="Calf AI Prediction API", version="1.0")

@app.get("/next-id")
def get_next_id():
    try:
        df = pd.read_csv('cattle_data.csv')
        if df.empty:
            return {"next_id": "CATTLE_1001"}
        
        # Extract numbers from CATTLE_XXXX
        # Simple approach: find all IDs starting with CATTLE_, parse int, find max
        max_id = 0
        for pid in df['Animal_ID']:
            if isinstance(pid, str) and pid.startswith('CATTLE_'):
                try:
                    num = int(pid.split('_')[1])
                    if num > max_id:
                        max_id = num
                except ValueError:
                    continue
        
        return {"next_id": f"CATTLE_{max_id + 1}"}
    except Exception as e:
        # Fallback if file doesn't exist or is empty
        return {"next_id": "CATTLE_1001"}

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
# Load environment variables
load_dotenv()

# --- Authentication Configuration ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_USERNAME"),
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

# Auth Store
otp_store = {}
if not os.path.exists('users.csv'):
    pd.DataFrame(columns=['email', 'password_hash']).to_csv('users.csv', index=False)

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# --- Data Schemas ---
class CattleInput(BaseModel):
    # Matches features needed by the model pipeline
    Animal_ID: str
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

# --- Auth Endpoints ---

@app.post("/auth/register")
async def register(user: UserRegister, background_tasks: BackgroundTasks):
    try:
        df = pd.read_csv('users.csv')
        if user.email in df['email'].values:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Generate OTP
        otp = str(secrets.randbelow(999999)).zfill(6)
        
        # Store securely (in memory for hackathon)
        print(f"DEBUG: Registering {user.email}, Password Length: {len(user.password)}")
        
        # BCrypt limit safeguard
        pwd_to_hash = user.password
        if len(pwd_to_hash.encode('utf-8')) >= 72:
            print("WARNING: Password too long for bcrypt, truncating...")
            pwd_to_hash = pwd_to_hash[:71]

        hashed_pw = pwd_context.hash(pwd_to_hash)

        otp_store[user.email] = {
            "otp": otp,
            "password": hashed_pw
        }

        # Send Email
        message = MessageSchema(
            subject="Calf AI - Verify your Account",
            recipients=[user.email],
            body=f"Your verification code is: {otp}",
            subtype=MessageType.html
        )
        
        fm = FastMail(conf)
        background_tasks.add_task(fm.send_message, message)
        
        return {"message": "OTP sent to email"}
    except Exception as e:
        print(f"Mail Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/verify")
def verify_otp(data: VerifyOTP):
    if data.email not in otp_store:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    stored_data = otp_store[data.email]
    if stored_data["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Save to users.csv
    try:
        new_user = pd.DataFrame([{
            "email": data.email,
            "password_hash": stored_data["password"]
        }])
        new_user.to_csv('users.csv', mode='a', header=False, index=False)
        del otp_store[data.email]
        return {"message": "Verification successful", "token": "hackathon-token"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login(user: UserLogin):
    try:
        df = pd.read_csv('users.csv')
        record = df[df['email'] == user.email]
        
        if record.empty:
            raise HTTPException(status_code=400, detail="Invalid credentials")
            
        hashed_password = record.iloc[0]['password_hash']
        
        # Debug and Truncate
        print(f"DEBUG: Login attempt for {user.email}, Pwd Len: {len(user.password)}")
        pwd_to_check = user.password
        if len(pwd_to_check.encode('utf-8')) >= 72:
             print("WARNING: Login password too long, truncating...")
             pwd_to_check = pwd_to_check[:71]

        if not pwd_context.verify(pwd_to_check, hashed_password):
            raise HTTPException(status_code=400, detail="Invalid credentials")
            
        return {"message": "Login successful", "token": "hackathon-token"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

@app.post("/save-record")
def save_record(data: CattleInput):
    try:
        # Convert input to dictionary
        new_record = data.dict()
        
        # Create DataFrame
        df_new = pd.DataFrame([new_record])
        
        # Append to CSV
        with open('cattle_data.csv', 'a') as f:
            df_new.to_csv(f, header=f.tell()==0, index=False)
            
        return {"status": "success", "message": "Record saved successfully"}
    except Exception as e:
        print(f"Save Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

