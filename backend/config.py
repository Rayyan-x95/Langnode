import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Supabase Settings
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("EXPO_PUBLIC_SUPABASE_URL", ""))
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY", ""))

# AI Engine Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
