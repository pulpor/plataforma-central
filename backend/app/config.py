import os

from dotenv import load_dotenv

load_dotenv()

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "PH_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

HOST = os.getenv("PH_HOST", "0.0.0.0")
PORT = int(os.getenv("PH_PORT", "8000"))
