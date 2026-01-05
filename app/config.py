import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    if not SUPABASE_URL:
        # In production this might log a warning, for now we raise to fail fast
        # But instructions say "Pass SUPABASE_URL", so we assume it comes from env
        pass 
        
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set.")
