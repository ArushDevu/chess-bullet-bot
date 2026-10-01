import os, bcrypt
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path="supabase.env")

salt = bcrypt.gensalt()

url: str = os.getenv("VITE_SUPABASE_URL")
key: str = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

def createUser(username, email, password):
  hashedPassword = bcrypt.hashpw(password=password, salt=salt)
  supabase.table("profiles").insert({"name": username, "email": email, "password": hashedPassword}).execute()