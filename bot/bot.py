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

# --- .ENV LAADIMINE (Toetab nii bot/ kausta kui ka juurkausta) ---
env_path_bot = Path(__file__).parent / '.env'
env_path_root = Path(__file__).parent.parent / '.env'

if env_path_bot.exists():
    load_dotenv(dotenv_path=env_path_bot)
    logger.info(f"✅ Laadisin seaded: {env_path_bot}")
elif env_path_root.exists():
    load_dotenv(dotenv_path=env_path_root)
    logger.info(f"✅ Laadisin seaded: {env_path_root}")
else:
    logger.warning("⚠️ .env faili ei leitud!")

# Võtame muutujaid arvestades nii tavalist kui VITE_ formaati
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
BINANCE_KEY = os.getenv('BINANCE_API_KEY')
BINANCE_SECRET = os.getenv('BINANCE_API_SECRET')

# Ühenduste initsialiseerimine
supabase = None
client = None

try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL või Key on puudu!")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Binance'i ühendus (töötab ka tühjade võtmetega ainult andmete lugemiseks)
    client = Client(BINANCE_KEY, BINANCE_SECRET)
    logger.info("✅ Ühendused Binance'i ja Supabase'iga loodud.")
except Exception as e:
    logger.error(f"❌ Ühenduse viga: {e}")

SYMBOL = 'BTCUSDT'
last_buy_price = None
last_portfolio_update = time.time()

# --- ABIFUNKTSIOONID ---

def get_bot_settings():
    try:
        if supabase:
            res = supabase.table("bot_settings").select("*").eq("id", 1).single().execute()
            return res.data if res.data else {"stop_loss": -2.0, "take_profit": 3.0, "min_ai_confidence": 0.6}
    except:
        pass
    return {"stop_loss": -2.0, "take_profit": 3.0, "min_ai_confidence": 0.6}

def update_portfolio(price, btc_balance=0.5, usdt_balance=5000):
    """Uuendab portfolio andmeid Supabase'sse"""
    try:
        if not supabase:
            return
        
        # Arvutame koguväärtuse
        total_value = (btc_balance * price) + usdt_balance
        
        # Leiame viimase portfolio rea ja uuendame seda
        portfolio_data = {
            "total_value_usdt": float(total_value),
            "btc_balance": float(btc_balance),
            "usdt_balance": float(usdt_balance),
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        # Proovime uuendada - kui pole ridu, siis insert
        result = supabase.table("portfolio").insert(portfolio_data).execute()
        logger.debug(f"Portfolio uuendatud: {total_value:.2f} USDT")
    except Exception as e:
        logger.warning(f"⚠️ Portfolio update viga: {e}")

def get_market_data(symbol):
    try:
        # Tõmbame andmed indikaatorite jaoks
        klines = client.get_historical_klines(symbol, '1m', "500 minutes ago UTC")
        df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume', '_', '_', '_', '_', '_', '_'])
        df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].apply(pd.to_numeric)
        
        # RSI ja MACD
        df['rsi'] = ta.rsi(df['close'], length=14)
        macd = ta.macd(df['close'])
        df['macd'] = macd.iloc[:, 0]
        df['macd_signal'] = macd.iloc[:, 2]
        
        # Bollinger Bands
        bbands = ta.bbands(df['close'], length=20, std=2)
        if bbands is not None:
            df['bb_lower'] = bbands.iloc[:, 0]
            df['bb_upper'] = bbands.iloc[:, 2]
        
        # VWAP
        df['time_dt'] = pd.to_datetime(df['time'], unit='ms')
        df.set_index('time_dt', inplace=True)
        df['vwap'] = ta.vwap(df['high'], df['low'], df['close'], df['volume'])
        df.reset_index(inplace=True)
        
        # Stochastic
        stoch = ta.stoch(df['high'], df['low'], df['close'])
        if stoch is not None:
            df['stoch_k'] = stoch.iloc[:, 0]
            df['stoch_d'] = stoch.iloc[:, 1]
        
        # ATR ja EMA
        df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=14)
        df['ema200'] = ta.ema(df['close'], length=200)
        
        return df
    except Exception as e:
        logger.error(f"❌ Viga indikaatorite arvutamisel: {e}")
        return None

def get_order_book_status(symbol):
    try:
        depth = client.get_order_book(symbol=symbol, limit=10)
        bids = sum([float(p) * float(q) for p, q in depth['bids']])
        asks = sum([float(p) * float(q) for p, q in depth['asks']])
        return bids / asks
    except:
        return 1.0

# --- STRATEEGIA ---

def analyze_signals(df):
    global last_buy_price
    settings = get_bot_settings()
    
    curr = df.iloc[-1]
    price = curr['close']
    prediction = 0.5
    pressure = get_order_book_status(SYMBOL)
    
    # Mudeli laadimine (otsime bot kaustast)
    model_file = Path(__file__).parent / 'trading_brain_xgb.pkl'
    if model_file.exists():
        try:
            model = joblib.load(model_file)
            features = [
                float(price), float(curr['rsi']), float(curr['macd']), float(curr['macd_signal']),
                float(curr['vwap']), float(curr['stoch_k']), float(curr['stoch_d']),
                float(curr['atr']), float(curr['ema200']), float(pressure)
            ]
            prediction = model.predict_proba([features])[0][1]
        except Exception as e:
            logger.warning(f"Mudeli ennustus ebaõnnestus: {e}")

    action = "HOLD"
    pnl = 0
    threshold = float(settings.get('min_ai_confidence', 0.6))

    if last_buy_price is None:
        if prediction >= threshold and curr['stoch_k'] < 30:
            action = "BUY"
            last_buy_price = price
            summary = f"🚀 BUY | AI:{prediction:.2f} | Stoch:{curr['stoch_k']:.1f}"
        else:
            summary = f"HOLD | Price:{price} | AI:{prediction:.2f}"
    else:
        pnl = ((price - last_buy_price) / last_buy_price) * 100
        if pnl <= float(settings.get('stop_loss', -2.0)) or pnl >= float(settings.get('take_profit', 3.0)):
            action = "SELL"
            summary = f"💰 SELL | PnL:{pnl:.2f}%"
            last_buy_price = None
        else:
            summary = f"HOLD (In Trade) | PnL:{pnl:.2f}% | AI:{prediction:.2f}"

    return action, summary, pnl, prediction

# --- SALVESTAMINE ---

def log_to_supabase(action, df, pnl, summary, prediction):
    if not supabase:
        return
    try:
        curr = df.iloc[-1]
        pressure = get_order_book_status(SYMBOL)
        
        def clean(val):
            return float(val) if not pd.isna(val) else 0.0

        data = {
            "symbol": SYMBOL,
            "action": action,
            "price": clean(curr['close']),
            "rsi": clean(curr['rsi']),
            "macd": clean(curr['macd']),
            "macd_signal": clean(curr['macd_signal']),
            "vwap": clean(curr['vwap']),
            "stoch_k": clean(curr['stoch_k']),
            "stoch_d": clean(curr['stoch_d']),
            "bb_upper": clean(curr['bb_upper']),
            "bb_lower": clean(curr['bb_lower']),
            "atr": clean(curr['atr']),
            "ema200": clean(curr['ema200']),
            "volume": clean(curr['volume']),
            "pnl": float(pnl),
            "analysis_summary": summary,
            "market_pressure": clean(pressure),
            "ai_prediction": float(prediction)
        }
        supabase.table("trade_logs").insert(data).execute()
    except Exception as e:
        logger.error(f"❌ Logimise viga: {e}")

# --- PÕHITSÜKKEL ---

def run_bot():
    global last_portfolio_update
    logger.info(f"🤖 Bot V2.2 (Monorepo Ready) käivitatud: {SYMBOL}")
    while True:
        try:
            df = get_market_data(SYMBOL)
            if df is not None:
                current_price = df.iloc[-1]['close'] if len(df) > 0 else 0
                
                action, summary, pnl, prediction = analyze_signals(df)
                log_to_supabase(action, df, pnl, summary, prediction)
                
                # Uuendame portfolio iga 5 minuti tagant
                current_time = time.time()
                if current_time - last_portfolio_update > 300:  # 300 sec = 5 min
                    update_portfolio(current_price, btc_balance=0.5, usdt_balance=5000)
                    last_portfolio_update = current_time
                
                if action != "HOLD": 
                    logger.info(f"🔔 TEHING: {summary}")
                else:
                    # Kuvab terminalis jooksvat infot samal real
                    print(f"[{time.strftime('%H:%M:%S')}] {summary}", end='\r')
            
            time.sleep(30)
        except Exception as e:
            logger.error(f"Põhitsükli viga: {e}")
            time.sleep(10)

if __name__ == "__main__":
    run_bot()