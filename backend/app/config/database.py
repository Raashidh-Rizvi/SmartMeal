# Delegate to the canonical db module to avoid duplicate clients
from app.db.database import get_db

db = get_db()
