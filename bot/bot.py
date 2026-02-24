import os
import time
import pandas as pd
import pandas_ta as ta
import numpy as np
import joblib
import logging
import sys
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from binance.client import Client

# --- 1. LOGIMINE JA SÄTTED ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)
load_dotenv()

# --- 2. KONFIGURATSIOON ---
SYMBOL = "BTCUSDT"
FEATURES = ['price', 'rsi', 'macd', 'macd_signal', 'vwap', 'stoch_k', 'stoch_d', 'atr', 'ema200', 'market_pressure']
current_position = None 

# --- 3. ÜHENDUSED ---
try:
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    binance = Client(os.getenv('BINANCE_API_KEY'), os.getenv('BINANCE_API_SECRET'))
    logger.info(f"✅ Ühendused loodud: {SYMBOL}")
except Exception as e:
    logger.error(f"❌ Ühenduse viga: {e}")
    sys.exit(1)

# --- 4. FUNKTSIOONID ---

def sync_position_from_supabase():
    """Vaatab Supabase'ist viimast logi, et näha, kas oleme LONG positsioonis."""
    try:
        # Küsime viimast rida, kus action oli kas BUY või SELL
        response = supabase.table("trade_logs") \
            .select("action, price, avg_entry_price") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if response.data:
            last_log = response.data[0]
            # Kui viimane tegevus oli ost või meil on avg_entry olemas, siis oleme sees
            if last_log['action'] == "LONG" or last_log['avg_entry_price'] > 0:
                logger.info(f"🔄 Positsioon taastatud andmebaasist: {last_log['avg_entry_price']}")
                return {
                    "entry_price": float(last_log['avg_entry_price'] if last_log['avg_entry_price'] > 0 else last_log['price']),
                    "amount": 0.001 # Paper trade staatiline kogus
                }
        
        logger.info("ℹ️ Avatud positsiooni andmebaasist ei leitud.")
        return None
    except Exception as e:
        logger.error(f"❌ Ei saanud andmebaasist positsiooni taastada: {e}")
        return None

def fetch_data():
    try:
        klines = binance.get_klines(symbol=SYMBOL, interval=Client.KLINE_INTERVAL_1MINUTE, limit=300)
        df = pd.DataFrame(klines, columns=['ts', 'open', 'high', 'low', 'close', 'vol', 'close_ts', 'qav', 'num_trades', 'taker_base', 'taker_quote', 'ignore'])
        df[['open', 'high', 'low', 'close', 'vol']] = df[['open', 'high', 'low', 'close', 'vol']].astype(float)
        
        # VWAP vajab kellaaega indeksiks
        df['ts'] = pd.to_datetime(df['ts'], unit='ms')
        df.set_index('ts', inplace=True)
        df.rename(columns={'close': 'price'}, inplace=True)

        # Tehniline analüüs
        df['rsi'] = ta.rsi(df['price'], length=14)
        macd = ta.macd(df['price'])
        df['macd'] = macd.iloc[:, 0] if macd is not None else 0
        df['macd_signal'] = macd.iloc[:, 2] if macd is not None else 0
        df['ema200'] = ta.ema(df['price'], length=200)
        df['vwap'] = ta.vwap(df['high'], df['low'], df['price'], df['vol'])
        stoch = ta.stoch(df['high'], df['low'], df['price'])
        df['stoch_k'] = stoch.iloc[:, 0] if stoch is not None else 0
        df['stoch_d'] = stoch.iloc[:, 1] if stoch is not None else 0
        df['atr'] = ta.atr(df['high'], df['low'], df['price'])
        df['market_pressure'] = (df['price'] - df['low']) / (df['high'] - df['low'] + 0.0000001) * df['vol']
        
        bbands = ta.bbands(df['price'], length=20, std=2)
        df['bb_upper'] = bbands.iloc[:, 2] if bbands is not None else df['price']
        df['bb_lower'] = bbands.iloc[:, 0] if bbands is not None else df['price']
        df['is_panic_mode'] = df['price'] < df['bb_lower']
        
        return df.iloc[-1].fillna(0).to_dict()
    except Exception as e:
        logger.error(f"❌ Viga andmete hankimisel: {e}")
        return None

# --- 5. PÕHITSÜKKEL ---
def start_bot():
    global current_position
    
    # SÜNKRONISEERIMINE STARTIMISEL
    current_position = sync_position_from_supabase()

    # Laeme aju
    model = joblib.load('trading_brain_xgb.pkl') if os.path.exists('trading_brain_xgb.pkl') else None
    if model:
        logger.info("🧠 AI Mudel laaditud.")
    else:
        logger.warning("⚠️ Mudelit ei leitud, bot kogub ainult andmeid.")

    while True:
        start_time = time.time()
        data = fetch_data()
        
        if data:
            # 1. AI Ennustus
            feat_vector = [float(data.get(f, 0)) for f in FEATURES]
            if model:
                probs = model.predict_proba(np.array([feat_vector]))[0]
                action = ["SHORT", "HOLD", "LONG"][np.argmax(probs)]
                confidence = float(np.max(probs))
            else:
                action, confidence, probs = "HOLD", 0.0, [0, 1, 0]

            # 2. Arvutused
            current_price = float(data['price'])
            avg_entry = float(current_position['entry_price']) if current_position else 0.0
            pnl = ((current_price - avg_entry) / avg_entry * 100) if avg_entry > 0 else 0.0
            summary = f"AI: {action} | L:{probs[2]:.2f} S:{probs[0]:.2f} PNL:{pnl:.2f}%"

            # 3. Payload
            log_payload = {
                "price": current_price,
                "rsi": float(data['rsi']),
                "macd": float(data['macd']),
                "macd_signal": float(data['macd_signal']),
                "vwap": float(data['vwap']),
                "stoch_k": float(data['stoch_k']),
                "stoch_d": float(data['stoch_d']),
                "atr": float(data['atr']),
                "ema200": float(data['ema200']),
                "market_pressure": float(data['market_pressure']),
                "symbol": SYMBOL,
                "pnl": pnl,
                "ai_prediction": confidence,
                "bot_confidence": confidence,
                "fear_greed_index": 50,
                "is_panic_mode": bool(data['is_panic_mode']),
                "bb_upper": float(data['bb_upper']),
                "bb_lower": float(data['bb_lower']),
                "volume": float(data['vol']),
                "avg_entry_price": avg_entry,
                "action": action,
                "analysis_summary": summary,
                "created_at": datetime.utcnow().isoformat()
            }

            # 4. Kauplemise otsus
            if action == "LONG" and confidence > 0.45 and current_position is None:
                current_position = {"entry_price": current_price}
                logger.info(f"🚀 OST: {current_price}")
            elif action == "SHORT" and confidence > 0.45 and current_position is not None:
                current_position = None
                logger.info(f"🚀 MÜÜK: {current_price}")

            # 5. Salvestamine
            try:
                supabase.table("trade_logs").insert(log_payload).execute()
                logger.info(f"📊 {summary} | Hind: {current_price}")
            except Exception as e:
                logger.error(f"❌ Supabase viga: {e}")

        time.sleep(max(0, 60 - (time.time() - start_time)))

if __name__ == "__main__":
    start_bot()