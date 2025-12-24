# Backend Instructions

## How to Start the Server
Since you are using a virtual environment within a parent directory, you must use the full path to the python executable.

**Run this command from `d:\CattleYield\backend`:**

```powershell
..\.venv\Scripts\python.exe main.py
```

## Why not just `python main.py`?
Your system default Python is not set up in the PATH, or doesn't have the libraries installed. The virtual environment (`.venv`) has all the correct dependencies (FastAPI, Scikit-Learn, Gemini).
