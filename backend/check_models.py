import google.generativeai as genai
import os

GEMINI_API_KEY = "AIzaSyC9NG4YHX1IdCmY9M8fq1KkTezdzG0lbaU"
genai.configure(api_key=GEMINI_API_KEY)

try:
    print("Listing available models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
