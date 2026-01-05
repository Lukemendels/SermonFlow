from supabase import create_client, Client
from app.config import Config

# Initialize the client only if keys are present to avoid import errors during build if env vars missing
# However, application logic requires it.
try:
    supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
except Exception as e:
    print(f"Warning: Supabase client not initialized: {e}")
    supabase = None

def get_supabase() -> Client:
    if not supabase:
        raise ValueError("Supabase client is not initialized. check SUPABASE_URL and SUPABASE_KEY.")
    return supabase
