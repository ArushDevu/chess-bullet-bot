import os, bcrypt
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / "frontend" / ".env")

url: str = os.getenv("VITE_SUPABASE_URL")
key: str = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

def createUser(username, email, password):
  hashedPassword = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
  return hashedPassword