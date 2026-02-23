import os
import pandas as pd
import joblib
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import logging

# 1. SEADISTUS
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [backtest] %(message)s')
logger = logging.getLogger(__name__)

# --- .ENV LAADIMINE (Monorepo toetus) ---
env_path_bot = Path(__file__).parent / '.env'
env_path_root = Path(__file__).parent.parent / '.env'

if env_path_bot.exists():
    load_dotenv(dotenv_path=env_path_bot)
elif env_path_root.exists():
    load_dotenv(dotenv_path=env_path_root)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("✅ Supabase ühendus loodud.")
except Exception as e:
    logger.error(f"❌ Ühenduse viga: {e}")
    exit()

def run_backtest():
    # 1. Laadi andmed
    res = supabase.table("trade_logs").select("*").order("created_at", desc=False).limit(1000).execute()
    df = pd.DataFrame(res.data)
    
    if len(df) < 20:
        print("Liiga vähe andmeid backtestiks.")
        return

    # 2. Laadi mudel
    model_path = Path(__file__).parent / 'trading_brain_xgb.pkl'
    if not model_path.exists():
        print("Mudelit ei leitud! Käivita enne brain.py")
        return
    
    model = joblib.load(model_path)

    # 3. Simuleeri
    balance = 100.0  # Alustame 100 USDT-ga
    position = 0     # 0 = ei oma, 1 = omame BTC
    buy_price = 0
    trades = 0
    wins = 0

    print(f"\n--- BACKTEST ALUSTATUD ({len(df)} rida) ---")

    features_list = ['price', 'rsi', 'macd', 'macd_signal', 'vwap', 'stoch_k', 'stoch_d', 'atr', 'ema200', 'market_pressure']

    for i in range(len(df)):
        curr = df.iloc[i]
        
        # Valmistame ette tunnused ennustuseks
        try:
            feats = [float(curr[f]) for f in features_list]
            prob = model.predict_proba([feats])[0][1]
        except:
            continue

        price = float(curr['price'])

        # OSTMINE: Ennustus > 0.6 ja meil pole positsiooni
        if position == 0 and prob > 0.6 and float(curr['stoch_k']) < 30:
            buy_price = price
            position = 1
            trades += 1
            print(f"[{curr['created_at'][:16]}] BUY: {price:.2f} (AI: {prob:.2f})")

        # MÜÜMINE: Kasum 1% või kahjum -0.5% (või AI ütleb, et hind langeb)
        elif position == 1:
            pnl = (price - buy_price) / buy_price * 100
            if pnl > 1.0 or pnl < -0.5 or prob < 0.3:
                balance *= (1 + pnl/100)
                position = 0
                if pnl > 0: wins += 1
                trades += 1
                print(f"[{curr['created_at'][:16]}] SELL: {price:.2f} | PnL: {pnl:.2f}% | Balance: {balance:.2f} USDT")

    print("\n--- TULEMUSED ---")
    print(f"Lõppsaldo: {balance:.2f} USDT")
    print(f"Tehinguid kokku: {trades}")
    print(f"Võiduprotsent: {(wins/(trades/2)*100 if trades > 0 else 0):.1f}%")

if __name__ == "__main__":
    run_backtest()