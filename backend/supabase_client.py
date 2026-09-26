import os
from typing import Dict, List, Optional
from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

# In-memory storage fallback for local development & zero-setup runs
_IN_MEMORY_CONVERSATIONS: Dict[str, List[Dict]] = {}

def get_supabase_client():
    if not SUPABASE_URL or not (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY):
        return None
    try:
        from supabase import create_client, Client
        key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
        return create_client(SUPABASE_URL, key)
    except Exception as e:
        print(f"[Supabase] Could not instantiate Supabase client: {e}")
        return None

async def save_turn_to_db(conversation_id: str, user_message: str, bot_response: str, language: str, level: str):
    client = get_supabase_client()
    turn_data = {
        "conversation_id": conversation_id,
        "user_message": user_message,
        "bot_response": bot_response,
        "language": language,
        "explanation_level": level,
    }

    if client:
        try:
            client.table("conversation_turns").insert(turn_data).execute()
            return
        except Exception as e:
            print(f"[Supabase] Table insert failed: {e}. Falling back to in-memory store.")

    if conversation_id not in _IN_MEMORY_CONVERSATIONS:
        _IN_MEMORY_CONVERSATIONS[conversation_id] = []
    _IN_MEMORY_CONVERSATIONS[conversation_id].append(turn_data)

async def get_conversation_history(conversation_id: str) -> List[Dict]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("conversation_turns").select("*").eq("conversation_id", conversation_id).execute()
            if res.data:
                return res.data
        except Exception as e:
            print(f"[Supabase] History fetch failed: {e}")

    return _IN_MEMORY_CONVERSATIONS.get(conversation_id, [])
