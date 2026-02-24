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
from binance.exceptions import BinanceAPIException

# --- 1. SEADISTUSED JA LOGIMINE (Mahukas osa) ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler("bot_log.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)
load_dotenv()

# --- 2. ÜHENDUSED JA KONFIGURATSIOON ---
SYMBOL = "BTCUSDT"
INTERVAL = Client.KLINE_INTERVAL_1MINUTE
FEATURES = ['price', 'rsi', 'macd', 'macd_signal', 'vwap', 'stoch_k', 'stoch_d', 'atr', 'ema200', 'market_pressure']

try:
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    binance = Client(os.getenv('BINANCE_API_KEY'), os.getenv('BINANCE_API_SECRET'))
    logger.info(f"✅ Ühendused loodud! Jälgitav paar: {SYMBOL}")
except Exception as e:
    logger.error(f"❌ Kriitiline viga ühenduse loomisel: {e}")
    sys.exit(1)

# --- 3. ABI-FUNKTSIOONID (Teevad koodi pikemaks ja turvalisemaks) ---

def check_network():
    """Kontrollib, kas ühendus Binance'iga on olemas."""
    try:
        binance.ping()
        return True
    except:
        return False

def format_prediction_summary(action, probs):
    """Koostab ilusa ülevaate Dashboardi jaoks."""
    l_prob = probs[2]
    s_prob = probs[0]
    h_prob = probs[1]
    return f"AI: {action} | L:{l_prob:.2f} S:{s_prob:.2f} H:{h_prob:.2f} [{datetime.now().strftime('%H:%M:%S')}]"

# --- 4. TURUANDMETE ANALÜÜS ---

def fetch_market_data(symbol=SYMBOL):
    try:
        if not check_network():
            logger.warning("⚠️ Võrguühendus puudub, ootan...")
            return None

        # Toome andmed (300 küünalt stabiilsuse huvides)
        klines = binance.get_klines(symbol=symbol, interval=INTERVAL, limit=300)
        df = pd.DataFrame(klines, columns=['ts', 'open', 'high', 'low', 'close', 'vol', 'close_ts', 'qav', 'num_trades', 'taker_base', 'taker_quote', 'ignore'])
        
        # Tüübiteisendused
        for col in ['open', 'high', 'low', 'close', 'vol']:
            df[col] = df[col].astype(float)

        df.rename(columns={'close': 'price'}, inplace=True)

        # Indikaatorite arvutamine (Pandas-TA)
        df['rsi'] = ta.rsi(df['price'], length=14)
        macd = ta.macd(df['price'])
        if macd is not None:
            df['macd'] = macd['MACD_12_26_9']
            df['macd_signal'] = macd['MACDs_12_26_9']
        
        df['ema200'] = ta.ema(df['price'], length=200)
        df['vwap'] = ta.vwap(df['high'], df['low'], df['price'], df['vol'])
        
        stoch = ta.stoch(df['high'], df['low'], df['price'])
        if stoch is not None:
            df['stoch_k'] = stoch['STOCHk_14_3_3']
            df['stoch_d'] = stoch['STOCHd_14_3_3']
            
        df['atr'] = ta.atr(df['high'], df['low'], df['price'])
        
        # Edasijõudnud indikaator: Turu surve
        df['market_pressure'] = (df['price'] - df['low']) / (df['high'] - df['low'] + 0.0000001) * df['vol']
        
        # Puhastamine
        last_row = df.iloc[-1].fillna(0).to_dict()
        
        # Kontroll, kas indikaatorid on arvutatud
        if last_row['ema200'] == 0:
            logger.warning("⚠️ EMA200 pole veel valmis (vajab rohkem andmeid)")
            
        return last_row

    except BinanceAPIException as e:
        logger.error(f"❌ Binance API viga: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Tundmatu viga andmete toomisel: {e}")
        return None

# --- 5. AI AJU (XGBOOST ENNUSTUS) ---

def get_ai_prediction(data, model):
    if model is None:
        return "HOLD", 0.0, [0.0, 1.0, 0.0]
    
    try:
        # Features täpselt õiges järjekorras
        feat_vector = [float(data.get(f, 0)) for f in FEATURES]
        feat_array = np.array([feat_vector])
        
        # Tõenäosused
        probs = model.predict_proba(feat_array)[0]
        actions = ["SHORT", "HOLD", "LONG"]
        
        best_idx = np.argmax(probs)
        action = actions[best_idx]
        confidence = float(probs[best_idx])
        
        return action, confidence, probs.tolist()
    except Exception as e:
        logger.error(f"❌ Viga AI ennustusel: {e}")
        return "HOLD", 0.0, [0.0, 1.0, 0.0]

# --- 6. PEAMINE TÖÖTSÜKKEL ---

def start_bot():
    logger.info("--- 🤖 KAUPLEMISBOT KÄIVITATUD ---")
    
    # Mudeli laadimine
    try:
        model = joblib.load('trading_brain_xgb.pkl')
        logger.info("🧠 AI Mudel laaditud edukalt.")
    except:
        model = None
        logger.warning("⚠️ Mudelit ei leitud. Bot töötab ainult andmete kogujana.")

    while True:
        start_time = time.time()
        
        # 1. Toome andmed
        data = fetch_market_data()
        
        if data:
            # 2. Küsime AI arvamust
            action, confidence, probs = get_ai_prediction(data, model)
            summary = format_prediction_summary(action, probs)
            
            # 3. Logime tulemuse terminali
            logger.info(f"📊 Hind: {data['price']:.2f} | {summary}")
            
            # 4. Salvestame Supabase'i
            log_payload = {
                **{f: float(data.get(f, 0)) for f in FEATURES},
                "action": action,
                "ai_prediction": confidence,
                "analysis_summary": summary,
                "created_at": datetime.utcnow().isoformat()
            }
            
            try:
                supabase.table("trade_logs").insert(log_payload).execute()
            except Exception as e:
                logger.error(f"❌ Viga Supabase salvestamisel: {e}")

            # 5. SIIN ON KOHT TEHINGUTE JAOKS (DCA/Orders)
            # Näide:
            # if action == "LONG" and confidence > 0.65:
            #    execute_trade("BUY")

        # Hoia tsükli aega (nt täpselt 60 sek vahet)
        elapsed = time.time() - start_time
        sleep_time = max(0, 60 - elapsed)
        time.sleep(sleep_time)

if __name__ == "__main__":
    try:
        start_bot()
    except KeyboardInterrupt:
        logger.info("🛑 Bot peatatud kasutaja poolt.")
    except Exception as e:
        logger.error(f"⚠️ Bot kukkus kokku: {e}")