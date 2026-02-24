import os
import time
import pandas as pd
import pandas_ta as ta
import joblib
import logging
import datetime
import requests
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
    logger.info("✅ Ühendused loodud. Bot V3.3.1 (Full Logging Fix)")
except Exception as e:
    logger.error(f"❌ Ühenduse viga: {e}")

SYMBOL = 'BTCUSDT'
current_position = "NONE" 
entry_prices = []         
entry_count = 0           

# --- ABIFUNKTSIOONID ---

def get_fear_greed():
    try:
        r = requests.get('https://api.alternative.me/fng/')
        return int(r.json()['data'][0]['value'])
    except:
        return 50

def get_bot_settings():
    try:
        res = supabase.table("bot_settings").select("*").eq("id", 1).single().execute()
        return res.data if res.data else {"stop_loss": -2.0, "take_profit": 3.0, "min_ai_confidence": 0.55, "dca_step": -1.5}
    except:
        return {"stop_loss": -2.0, "take_profit": 3.0, "min_ai_confidence": 0.55, "dca_step": -1.5}

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
        # Küsime piisavalt ajalugu indikaatorite jaoks
        klines = client.get_historical_klines(symbol, '1m', "1000 minutes ago UTC")
        df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume', '_', '_', '_', '_', '_', '_'])
        df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].apply(pd.to_numeric)
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        df.set_index('time', inplace=True)
        
        # Arvutame kõik vajalikud indikaatorid
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
        
        df.dropna(inplace=True)
        return df
    except Exception as e:
        logger.error(f"❌ Viga andmetes: {e}")
        return None

def analyze_signals(df):
    global current_position, entry_prices, entry_count
    settings = get_bot_settings()
    curr = df.iloc[-1]
    price = curr['close']
    
    prediction_long = 0.5
    prediction_short = 0.0
    pressure = get_order_book_status(SYMBOL)
    
    model_file = Path(__file__).parent / 'trading_brain_xgb.pkl'
    if model_file.exists():
        try:
            model = joblib.load(model_file)
            def s(v): return float(v) if (v is not None and not pd.isna(v)) else 0.0
            feat = [[
                s(price), s(curr.get('rsi')), s(curr.get('macd')), s(curr.get('macd_signal')),
                s(curr.get('vwap')), s(curr.get('stoch_k')), s(curr.get('stoch_d')),
                s(curr.get('atr')), s(curr.get('ema200')), s(float(pressure))
            ]]
            
            probs = model.predict_proba(feat)[0]
            prediction_short = probs[0]
            prediction_long = probs[2]
        except Exception as e:
            logger.warning(f"Mudeli viga: {e}")

    action = "HOLD"
    pnl = 0.0
    threshold = float(settings.get('min_ai_confidence', 0.55))
    dca_trigger = float(settings.get('dca_step', -1.5))
    avg_price = sum(entry_prices) / len(entry_prices) if entry_prices else price

    # Loogika ja positsioonide haldus
    if current_position == "NONE":
        if prediction_long >= threshold:
            action, current_position, entry_prices, entry_count = "BUY_LONG", "LONG", [price], 1
        elif prediction_short >= threshold:
            action, current_position, entry_prices, entry_count = "SELL_SHORT", "SHORT", [price], 1
        summary = f"{action} | L:{prediction_long:.2f} S:{prediction_short:.2f}"

    elif current_position == "LONG":
        pnl = ((price - avg_price) / avg_price) * 100
        if pnl <= dca_trigger and prediction_long > 0.50 and entry_count < 3:
            action, entry_count = "DCA_LONG", entry_count + 1
            entry_prices.append(price)
            summary = f"➕ DCA LONG #{entry_count}"
        elif pnl >= float(settings.get('take_profit', 3.0)) or pnl <= float(settings.get('stop_loss', -3.0)) or prediction_long < 0.35:
            action, current_position, entry_prices, entry_count = "CLOSE_LONG", "NONE", [], 0
            summary = f"💰 EXIT LONG | PnL:{pnl:.2f}%"
        else:
            summary = f"HOLD LONG | PnL:{pnl:.2f}% | L:{prediction_long:.2f}"

    elif current_position == "SHORT":
        pnl = ((avg_price - price) / avg_price) * 100
        if pnl <= dca_trigger and prediction_short > 0.50 and entry_count < 3:
            action, entry_count = "DCA_SHORT", entry_count + 1
            entry_prices.append(price)
            summary = f"➕ DCA SHORT #{entry_count}"
        elif pnl >= float(settings.get('take_profit', 3.0)) or pnl <= float(settings.get('stop_loss', -3.0)) or prediction_short < 0.35:
            action, current_position, entry_prices, entry_count = "CLOSE_SHORT", "NONE", [], 0
            summary = f"💰 EXIT SHORT | PnL:{pnl:.2f}%"
        else:
            summary = f"HOLD SHORT | PnL:{pnl:.2f}% | S:{prediction_short:.2f}"

    return action, summary, pnl, (prediction_long if current_position != "SHORT" else prediction_short)

def log_to_supabase(action, df, pnl, summary, confidence):
    if not supabase: return
    try:
        curr = df.iloc[-1]
        pressure = get_order_book_status(SYMBOL)
        fng = get_fear_greed()
        global current_position, entry_count, entry_prices
        avg_price = sum(entry_prices) / len(entry_prices) if entry_prices else curr['close']
        
        def c(v): return float(v) if (v is not None and not pd.isna(v)) else 0.0

        # --- TÄIELIK ANDMETE LOGIMINE ---
        data = {
            "symbol": SYMBOL,
            "action": action,
            "price": c(curr['close']),
            "position_side": current_position,
            "entry_count": int(entry_count),
            "avg_entry_price": c(avg_price),
            "rsi": c(curr.get('rsi')),
            "macd": c(curr.get('macd')),
            "macd_signal": c(curr.get('macd_signal')),
            "bb_upper": c(curr.get('bb_upper')),
            "bb_lower": c(curr.get('bb_lower')),
            "stoch_k": c(curr.get('stoch_k')),
            "stoch_d": c(curr.get('stoch_d')),
            "atr": c(curr.get('atr')),
            "ema200": c(curr.get('ema200')),
            "vwap": c(curr.get('vwap')),
            "volume": c(curr.get('volume')),
            "pnl": float(pnl),
            "analysis_summary": str(summary),
            "market_pressure": c(pressure),
            "ai_prediction": float(confidence),
            "bot_confidence": float(confidence),
            "fear_greed_index": int(fng),
            "is_panic_mode": False
        }
        supabase.table("trade_logs").insert(data).execute()
    except Exception as e:
        logger.error(f"❌ Logimise viga: {e}")

def run_bot():
    logger.info(f"🤖 Bot V3.3.1 käivitatud: {SYMBOL}")
    while True:
        try:
            df = get_market_data(SYMBOL)
            if df is not None and not df.empty:
                action, summary, pnl, confidence = analyze_signals(df)
                log_to_supabase(action, df, pnl, summary, confidence)
                ts = datetime.datetime.now().strftime('%H:%M:%S')
                print(f"[{ts}] {summary}")
            time.sleep(30)
        except Exception as e:
            logger.error(f"Viga: {e}")
            time.sleep(10)

if __name__ == "__main__":
    run_bot()