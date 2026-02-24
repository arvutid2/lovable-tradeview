import os
import pandas as pd
import numpy as np
import xgboost as xgb
from joblib import dump
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import logging

# 1. LOGIMISE SEADISTUS
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [brain] %(message)s')
logger = logging.getLogger(__name__)

# --- .ENV LAADIMINE ---
env_path = Path(__file__).parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

supabase = None
try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL või Key puudu!")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("✅ Supabase ühendus loodud.")
except Exception as e:
    logger.error(f"❌ Supabase ühenduse viga: {e}")

def train_new_model():
    logger.info("🧠 Alustan uue multi-class mudeli treenimist (Short/Long/DCA)...")
    
    if not supabase:
        logger.error("Supabase ühendus puudub.")
        return

    try:
        # Tõmbame andmed. NB! Nüüd võtame rohkem andmeid, et mustreid leida.
        res = supabase.table("trade_logs").select("*").not_.is_("macd", "null").order("created_at", desc=True).limit(2000).execute()
        data = res.data

        if len(data) < 100:
            logger.warning(f"⚠️ Liiga vähe andmeid uue loogika jaoks ({len(data)}). Vajame vähemalt 100.")
            return

        df = pd.DataFrame(data)
        df = df.sort_values('created_at')

        # --- MULTI-CLASS FEATURE ENGINEERING ---
        # Definitsioonid: 2 = LONG, 1 = HOLD, 0 = SHORT
        # Vaatame 15 minutit ettepoole
        window = 15
        df['future_max'] = df['price'].rolling(window=window).max().shift(-window)
        df['future_min'] = df['price'].rolling(window=window).min().shift(-window)
        
        def get_label(row):
            change_up = (row['future_max'] - row['price']) / row['price'] * 100
            change_down = (row['future_min'] - row['price']) / row['price'] * 100
            
            if change_up > 1.0: return 2 # LONG (potentsiaal tõusuks)
            if change_down < -1.0: return 0 # SHORT (potentsiaal languseks)
            return 1 # HOLD (stabiilne)

        df['target'] = df.apply(get_label, axis=1)

        # Valime tunnused (Peab ühtima bot.py-ga)
        features = [
            'price', 'rsi', 'macd', 'macd_signal', 
            'vwap', 'stoch_k', 'stoch_d', 'atr', 
            'ema200', 'market_pressure'
        ]
        
        df = df.dropna(subset=features + ['target'])
        
        X = df[features]
        y = df['target']

        # Mudeli treenimine - Multi-class softprob
        model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            objective='multi:softprob',
            num_class=3,
            random_state=42,
            eval_metric='mlogloss'
        )
        
        model.fit(X, y)
        
        model_path = Path(__file__).parent / 'trading_brain_xgb.pkl'
        dump(model, model_path)
        
        logger.info(f"🚀 UUS MULTI-DIRECTIONAL MUDEL SALVESTATUD! ({len(df)} rida)")

    except Exception as e:
        logger.error(f"❌ Viga treenimisel: {e}")

if __name__ == "__main__":
    train_new_model()