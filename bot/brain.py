import os
import pandas as pd
import xgboost as xgb
from joblib import dump
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import logging

# 1. LOGIMISE SEADISTUS
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [brain] %(message)s')
logger = logging.getLogger(__name__)

# --- .ENV LAADIMINE (Toetab monorepo struktuuri) ---
env_path_bot = Path(__file__).parent / '.env'
env_path_root = Path(__file__).parent.parent / '.env'

if env_path_bot.exists():
    load_dotenv(dotenv_path=env_path_bot)
elif env_path_root.exists():
    load_dotenv(dotenv_path=env_path_root)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

# Ühenduse loomine
supabase = None
try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL või Key puudu .env failist!")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("✅ Supabase ühendus loodud.")
except Exception as e:
    logger.error(f"❌ Supabase ühenduse viga: {e}")

def train_new_model():
    logger.info("🧠 Kontrollin andmeid uue mudeli jaoks...")
    
    if not supabase:
        logger.error("Supabase ühendus puudub, treenimine katkestatud.")
        return

    try:
        # Tõmbame viimased 1000 rida andmeid, kus olulised näitajad on olemas
        res = supabase.table("trade_logs").select("*").not_.is_("macd", "null").order("created_at", desc=True).limit(1000).execute()
        data = res.data

        if len(data) < 50:
            logger.warning(f"⚠️ Liiga vähe andmeid treenimiseks ({len(data)} rida). Vajame vähemalt 50.")
            return

        df = pd.DataFrame(data)
        
        # Sorteerime ajaliselt õigeks
        df = df.sort_values('created_at')

        # --- FEATURE ENGINEERING ---
        # Defineerime "sihtmärgi" (Target): kas hind tõusis järgmise kirje ajal?
        # 1 = Hind tõusis, 0 = Hind langes/jäi samaks
        df['target'] = (df['price'].shift(-1) > df['price']).astype(int)
        
        # Valime tunnused, mida mudel õpib (Peab ühtima bot.py listiga!)
        features = [
            'price', 'rsi', 'macd', 'macd_signal', 
            'vwap', 'stoch_k', 'stoch_d', 'atr', 
            'ema200', 'market_pressure'
        ]
        
        # Puhastame andmed tühjadest ridadest
        df = df.dropna(subset=features + ['target'])
        
        X = df[features]
        y = df['target']

        # Mudeli treenimine (XGBoost)
        model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        
        model.fit(X, y)
        
        # Salvestame mudeli bot-kausta
        model_path = Path(__file__).parent / 'trading_brain_xgb.pkl'
        dump(model, model_path)
        
        logger.info(f"🚀 UUS XGBOOST MUDEL LOODUD! ({len(df)} rida analüüsitud)")
        logger.info(f"📍 Mudel salvestatud: {model_path}")

    except Exception as e:
        logger.error(f"❌ Viga treenimisel: {e}")

if __name__ == "__main__":
    train_new_model()