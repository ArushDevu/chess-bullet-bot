import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path="supabase.env")

url: str = os.getenv("VITE_SUPABASE_URL")
key: str = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)