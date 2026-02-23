import os
import time
import pandas as pd
import pandas_ta as ta
import joblib
import logging
from pathlib import Path
from binance.client import Client
from supabase import create_client
from dotenv import load_dotenv

# 1. LOGIMISE SEADISTUS
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [bot] %(message)s')
logger = logging.getLogger(__name__)

# --- .ENV LAADIMINE ---
env_path_root = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path_root)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
BINANCE_KEY = os.getenv('BINANCE_API_KEY')
BINANCE_SECRET = os.getenv('BINANCE_API_SECRET')

supabase = None
client = None

try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase seaded puudu!")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    client = Client(BINANCE_KEY, BINANCE_SECRET)
    logger.info("✅ Ühendused loodud.")
except Exception as e:
    logger.error(f"❌ Ühenduse viga: {e}")

SYMBOL = 'BTCUSDT'
last_buy_price = None

# --- ABIFUNKTSIOONID ---

def get_bot_settings():
    try:
        res = supabase.table("bot_settings").select("*").eq("id", 1).single().execute()
        return res.data if res.data else {"stop_loss": -2.0, "take_profit": 3.0, "min_ai_confidence": 0.55}
    except:
        return {"stop_loss": -2.0, "take_profit": 3.0, "min_ai_confidence": 0.55}

def get_order_book_status(symbol):
    try:
        depth = client.get_order_book(symbol=symbol, limit=10)
        bids = sum([float(p) * float(q) for p, q in depth['bids']])
        asks = sum([float(p) * float(q) for p, q in depth['asks']])
        return bids / asks
    except:
        return 1.0

def get_market_data(symbol):
    try:
        klines = client.get_historical_klines(symbol, '1m', "500 minutes ago UTC")
        df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume', '_', '_', '_', '_', '_', '_'])
        df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].apply(pd.to_numeric)
        
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        df.set_index('time', inplace=True)
        
        # Indikaatorite arvutamine
        df['rsi'] = ta.rsi(df['close'], length=14)
        macd = ta.macd(df['close'])
        if macd is not None:
            df['macd'] = macd.iloc[:, 0]
            df['macd_signal'] = macd.iloc[:, 2]
        
        bbands = ta.bbands(df['close'], length=20, std=2)
        if bbands is not None:
            df['bb_lower'] = bbands.iloc[:, 0]
            df['bb_upper'] = bbands.iloc[:, 2]
        
        df['vwap'] = ta.vwap(df['high'], df['low'], df['close'], df['volume'])
        
        stoch = ta.stoch(df['high'], df['low'], df['close'])
        if stoch is not None:
            df['stoch_k'] = stoch.iloc[:, 0]
            df['stoch_d'] = stoch.iloc[:, 1]
        
        df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=14)
        df['ema200'] = ta.ema(df['close'], length=200)
        
        # --- PARANDATUD OSA: Tühjade väärtuste täitmine ---
        df = df.ffill() # Täidab eelmise väärtusega
        df = df.fillna(0) # Kui ikka tühi, siis 0
        
        return df
    except Exception as e:
        logger.error(f"❌ Viga indikaatorite arvutamisel: {e}")
        return None

# --- STRATEEGIA ---

def analyze_signals(df):
    global last_buy_price
    settings = get_bot_settings()
    curr = df.iloc[-1]
    price = curr['close']
    prediction = 0.5
    pressure = get_order_book_status(SYMBOL)
    
    model_file = Path(__file__).parent / 'trading_brain_xgb.pkl'
    if model_file.exists():
        try:
            model = joblib.load(model_file)
            
            def safe_f(val):
                return float(val) if (val is not None and not pd.isna(val)) else 0.0

            features = [
                safe_f(price), safe_f(curr.get('rsi')), safe_f(curr.get('macd')), 
                safe_f(curr.get('macd_signal')), safe_f(curr.get('vwap')), 
                safe_f(curr.get('stoch_k')), safe_f(curr.get('stoch_d')),
                safe_f(curr.get('atr')), safe_f(curr.get('ema200')), safe_f(pressure)
            ]
            
            prediction = model.predict_proba([features])[0][1]
        except Exception as e:
            logger.warning(f"Mudeli viga: {e}")

    action = "HOLD"
    pnl = 0
    threshold = float(settings.get('min_ai_confidence', 0.55))

    if last_buy_price is None:
        if prediction >= threshold:
            action = "BUY"
            last_buy_price = price
            summary = f"🚀 BUY | AI:{prediction:.2f}"
        else:
            summary = f"HOLD | Price:{price:.2f} | AI:{prediction:.2f}"
    else:
        pnl = ((price - last_buy_price) / last_buy_price) * 100
        if pnl <= float(settings.get('stop_loss', -2.0)) or pnl >= float(settings.get('take_profit', 3.0)):
            action = "SELL"
            summary = f"💰 SELL | PnL:{pnl:.2f}%"
            last_buy_price = None
        elif prediction < 0.42: 
            action = "SELL"
            summary = f"📉 AI EXIT | PnL:{pnl:.2f}%"
            last_buy_price = None
        else:
            summary = f"HOLD (In Trade) | PnL:{pnl:.2f}% | AI:{prediction:.2f}"

    return action, summary, pnl, prediction

# --- SALVESTAMINE ---

def log_to_supabase(action, df, pnl, summary, prediction):
    if not supabase: return
    try:
        curr = df.iloc[-1]
        pressure = get_order_book_status(SYMBOL)
        is_panic = False
        if len(df) > 5:
            old_p = df.iloc[-5]['close']
            if ((curr['close'] - old_p) / old_p) * 100 < -1.2:
                is_panic = True

        def clean(val):
            return float(val) if (not pd.isna(val) and val is not None) else 0.0

        data = {
            "symbol": SYMBOL, "action": action, "price": clean(curr['close']),
            "rsi": clean(curr.get('rsi')), "macd": clean(curr.get('macd')),
            "vwap": clean(curr.get('vwap')), "stoch_k": clean(curr.get('stoch_k')),
            "pnl": float(pnl), "analysis_summary": str(summary),
            "market_pressure": clean(pressure), "ai_prediction": float(prediction),
            "bot_confidence": float(prediction), "is_panic_mode": bool(is_panic),
            "fear_greed_index": 50
        }
        supabase.table("trade_logs").insert(data).execute()
    except Exception as e:
        logger.error(f"❌ Logimise viga: {e}")

def run_bot():
    logger.info(f"🤖 Bot V2.5.2 Running: {SYMBOL}")
    while True:
        try:
            df = get_market_data(SYMBOL)
            if df is not None:
                action, summary, pnl, prediction = analyze_signals(df)
                log_to_supabase(action, df, pnl, summary, prediction)
                
                ts = time.strftime('%H:%M:%S')
                if action != "HOLD": 
                    logger.info(f"🔔 {summary}")
                else:
                    print(f"[{ts}] {summary}", end='\r')
            
            time.sleep(30)
        except Exception as e:
            logger.error(f"Viga tsüklis: {e}")
            time.sleep(10)

if __name__ == "__main__":
    run_bot()