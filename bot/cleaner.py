import os
import logging
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# 1. LOGIMISE SEADISTUS
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [cleaner] %(message)s')
logger = logging.getLogger(__name__)

# --- .ENV LAADIMINE (Fix connection error) ---
env_path = Path(__file__).parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("❌ Supabase seaded puudu! Kontrolli .env faili.")
    exit()

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_smart_cleanup():
    logger.info("🧹 Alustan andmebaasi tarka puhastust (V3.0)...")
    
    try:
        # 1. Arvutame kuupäeva (nt 7 päeva tagasi)
        # Hoiame HOLD andmeid veidi kauem (7 päeva), et AI saaks treenida
        cutoff_date = (datetime.now() - timedelta(days=7)).isoformat()
        
        # 2. KUSTUTAME: Ainult need 'HOLD' read, mis on vanad
        # Me EI puutu ridu, kus action on midagi muud (BUY, SELL, DCA, CLOSE)
        response = supabase.table("trade_logs") \
            .delete() \
            .eq("action", "HOLD") \
            .lt("created_at", cutoff_date) \
            .execute()
        
        deleted_count = len(response.data) if response.data else 0
        logger.info(f"✅ Puhastus lõpetatud! Eemaldati {deleted_count} vana 'HOLD' rida.")
        
        # 3. VALIKULINE: Kontrollime tabeli suurust
        # Kui ridu on ikka liiga palju, võime vanu andmeid veelgi piirata.

    except Exception as e:
        logger.error(f"❌ Viga puhastamise käigus: {e}")

if __name__ == "__main__":
    run_smart_cleanup()