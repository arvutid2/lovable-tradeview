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
current_position = None  # Nüüd hoiab see: {"entry_price": float, "type": "LONG" või "SHORT"}

# --- 3. ÜHENDUSED ---
try:
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    binance = Client(os.getenv('BINANCE_API_KEY'), os.getenv('BINANCE_API_SECRET'))
    logger.info(f"✅ Ühendused loodud: {SYMBOL} (FUTURES MODE)")
except Exception as e:
    logger.error(f"❌ Ühenduse viga: {e}")
    sys.exit(1)

# --- 4. FUNKTSIOONID ---

def sync_position_from_supabase():
    """Taastab positsiooni: kas oleme LONG, SHORT või väljas."""
    try:
        response = supabase.table("trade_logs") \
            .select("action, price, avg_entry_price") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if response.data:
            last_log = response.data[0]
            # Kontrollime, kas viimases logis oli aktiivne positsioon
            if last_log['avg_entry_price'] > 0:
                # Kui viimane action oli LONG, siis oleme LONG. Kui SHORT, siis SHORT.
                pos_type = last_log['action'] 
                logger.info(f"🔄 Positsioon taastatud: {pos_type} @ {last_log['avg_entry_price']}")
                return {
                    "entry_price": float(last_log['avg_entry_price']),
                    "type": pos_type
                }
        return None
    except Exception as e:
        logger.error(f"❌ Positsiooni taastamise viga: {e}")
        return None

def fetch_data():
    try:
        klines = binance.get_klines(symbol=SYMBOL, interval=Client.KLINE_INTERVAL_1MINUTE, limit=300)
        df = pd.DataFrame(klines, columns=['ts', 'open', 'high', 'low', 'close', 'vol', 'close_ts', 'qav', 'num_trades', 'taker_base', 'taker_quote', 'ignore'])
        df[['open', 'high', 'low', 'close', 'vol']] = df[['open', 'high', 'low', 'close', 'vol']].astype(float)
        
        df['ts'] = pd.to_datetime(df['ts'], unit='ms')
        df.set_index('ts', inplace=True)
        df.rename(columns={'close': 'price'}, inplace=True)

        # Tehniline analüüs (Säilitatud kõik sinu indikaatorid)
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
    current_position = sync_position_from_supabase()

    model = joblib.load('trading_brain_xgb.pkl') if os.path.exists('trading_brain_xgb.pkl') else None
    if model:
        logger.info("🧠 AI Mudel laaditud (Futures Enabled).")
    else:
        logger.warning("⚠️ Mudelit ei leitud.")

    while True:
        start_time = time.time()
        data = fetch_data()
        
        if data:
            # --- TURVAKONTROLL: Kas andmed on reaalsed? ---
            # Kui maht on 0, tähendab see, et börsilt ei tulnud õigeid andmeid
            current_vol = float(data.get('vol', 0))
            current_price = float(data.get('price', 0))

            if current_vol == 0 or current_price == 0:
                logger.warning(f"⚠️ Vigased andmed börsilt (Vol: {current_vol}, Hind: {current_price}). Jätan vahele.")
                time.sleep(5) # Ootame 5 sekundit ja proovime uuesti
                continue
            
            # --- 0. LOE RISK ANDMEBAASIST ---
            try:
                r_res = supabase.table("risk_management").select("risk_percent").eq("id", 1).execute()
                # Teeme protsendist kordaja (nt 50% slider -> 0.5 kordaja)
                risk_multiplier = (r_res.data[0]['risk_percent'] / 100.0) if r_res.data else 1.0
            except Exception as e:
                logger.warning(f"⚠️ Ei saanud riski kätte, kasutan 100%: {e}")
                risk_multiplier = 1.0

            # 1. AI Ennustus
            feat_vector = [float(data.get(f, 0)) for f in FEATURES]
            if model:
                probs = model.predict_proba(np.array([feat_vector]))[0]
                ai_action = ["SHORT", "HOLD", "LONG"][np.argmax(probs)]
                confidence = float(np.max(probs))
            else:
                ai_action, confidence, probs = "HOLD", 0.0, [0, 1, 0]

            # 2. FUTUURIDE PNL ARVUTUS
            current_price = float(data['price'])
            avg_entry = float(current_position['entry_price']) if current_position else 0.0
            
            raw_pnl = 0.0
            if current_position:
                if current_position['type'] == "LONG":
                    raw_pnl = ((current_price - avg_entry) / avg_entry * 100)
                elif current_position['type'] == "SHORT":
                    raw_pnl = ((avg_entry - current_price) / avg_entry * 100)

            # RAKENDAME RISKI (Siin toimub maagia)
            final_pnl = raw_pnl * risk_multiplier

            summary = f"AI: {ai_action} | Risk: {risk_multiplier*100:.0f}% | PNL:{final_pnl:.2f}%"

            # 3. KAUPLEMISE OTSUS
            if ai_action == "LONG" and confidence > 0.45:
                if current_position is None or current_position['type'] == "SHORT":
                    current_position = {"entry_price": current_price, "type": "LONG"}
                    logger.info(f"🚀 OPEN LONG: {current_price}")

            elif ai_action == "SHORT" and confidence > 0.45:
                if current_position is None or current_position['type'] == "LONG":
                    current_position = {"entry_price": current_price, "type": "SHORT"}
                    logger.info(f"📉 OPEN SHORT: {current_price}")

            # 4. PAYLOAD SUPABASE-ILE
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
                "pnl": final_pnl, # Kasutame riskiga korrigeeritud PNL-i
                "ai_prediction": confidence,
                "bot_confidence": confidence,
                "fear_greed_index": 50,
                "is_panic_mode": bool(data['is_panic_mode']),
                "bb_upper": float(data['bb_upper']),
                "bb_lower": float(data['bb_lower']),
                "volume": float(data['vol']),
                "avg_entry_price": current_position['entry_price'] if current_position else 0.0,
                "action": current_position['type'] if current_position else "HOLD",
                "analysis_summary": summary,
                "created_at": datetime.utcnow().isoformat()
            }

            # 5. SALVESTAMINE
            try:
                supabase.table("trade_logs").insert(log_payload).execute()
                logger.info(f"📊 {summary} | Hind: {current_price}")
            except Exception as e:
                logger.error(f"❌ Supabase viga: {e}")

        time.sleep(max(0, 60 - (time.time() - start_time)))

if __name__ == "__main__":
    start_bot()