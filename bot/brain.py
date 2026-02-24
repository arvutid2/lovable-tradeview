import os
import pandas as pd
import numpy as np
import joblib
import logging
from xgboost import XGBClassifier
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Seadistame logimise
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [brain] %(message)s')
logger = logging.getLogger(__name__)

# --- PARANDUS: Otsime .env faili nii bot kaustast kui ka juurkaustast ---
env_path_local = Path('.') / '.env'
env_path_parent = Path('..') / '.env'

if env_path_local.exists():
    load_dotenv(dotenv_path=env_path_local)
    logger.info("✅ Kasutan .env faili boti kaustast")
elif env_path_parent.exists():
    load_dotenv(dotenv_path=env_path_parent)
    logger.info("✅ Kasutan .env faili juurkaustast")
else:
    logger.error("❌ .env faili ei leitud! Palun kopeeri .env fail boti kausta.")

# Võtame muutujad
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

if not url or not key:
    logger.error("❌ SUPABASE_URL või SUPABASE_KEY on puudu! Kontrolli .env faili sisu.")
    # See peatab koodi siin, et sa ei saaks SupabaseExceptionit
    exit()

supabase = create_client(url, key)

# TUNNUSTE JÄRJEKORD - Peab olema sama mis bot.py-s!
FEATURES = ['price', 'rsi', 'macd', 'macd_signal', 'vwap', 'stoch_k', 'stoch_d', 'atr', 'ema200', 'market_pressure']

def train_brain():
    logger.info("🧠 Alustan puhaste andmete laadimist...")
    
    try:
        # Tõmbame andmed, kus olulised näitajad pole NULL
        res = supabase.table("trade_logs").select("*") \
            .not_.is_("macd", "null") \
            .not_.is_("rsi", "null") \
            .order("created_at", desc=True) \
            .limit(2000).execute()
        
        if not res.data:
            logger.error("❌ Andmeid ei leitud Supabase'ist!")
            return

        df = pd.DataFrame(res.data)
        
        # Veendume, et kõik FEATURES on olemas
        missing_cols = [c for c in FEATURES if c not in df.columns]
        if missing_cols:
            logger.error(f"❌ Tabelis puuduvad veerud: {missing_cols}")
            return

        df[FEATURES] = df[FEATURES].apply(pd.to_numeric, errors='coerce')
        df = df.dropna(subset=FEATURES)

        # TARGE MÄRGISTAMINE
        df = df.sort_values('created_at')
        df['future_price'] = df['price'].shift(-15) 
        df['change_pct'] = (df['future_price'] - df['price']) / df['price'] * 100
        
        threshold = 0.1 

        def get_label(c):
            if c > threshold: return 2   # LONG
            if c < -threshold: return 0  # SHORT
            return 1                     # HOLD

        df['label'] = df['change_pct'].apply(get_label)
        df = df.dropna(subset=['label'])

        X = df[FEATURES]
        y = df['label']

        logger.info(f"📊 Treeningandmed: {len(df)} rida. Jaotus: {y.value_counts().to_dict()}")

        if len(df) < 10:
            logger.warning("⚠️ Liiga vähe andmeid treenimiseks!")
            return

        model = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            objective='multi:softprob',
            num_class=3,
            eval_metric='mlogloss'
        )
        
        model.fit(X, y)
        joblib.dump(model, 'trading_brain_xgb.pkl')
        logger.info("🚀 UUS AJU SALVESTATUD! (trading_brain_xgb.pkl)")

    except Exception as e:
        logger.error(f"❌ Viga treenimisel: {e}")

if __name__ == "__main__":
    train_brain()