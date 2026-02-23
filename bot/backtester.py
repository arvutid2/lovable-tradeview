"""
Backtest script für Trading Bot
Käivitamine: python backtester.py [hours]
"""
import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta

import pandas as pd
import pandas_ta as ta
import joblib
from binance.client import Client
from dotenv import load_dotenv

# Seadistused
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [backtest] %(message)s')
logger = logging.getLogger(__name__)

# .env laadimine
env_path = Path(__file__).parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

# Konstdandid
SYMBOL = 'BTCUSDT'
MODEL_PATH = Path(__file__).parent / 'trading_brain_xgb.pkl'

# Binance ühendus
try:
    client = Client(
        os.getenv('BINANCE_API_KEY', ''),
        os.getenv('BINANCE_API_SECRET', '')
    )
    logger.info("✅ Binance ühendus OK")
except Exception as e:
    logger.warning(f"⚠️ Binance ühendus: {e}")
    client = None

# Mudel laadamine
model = None
try:
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        logger.info(f"✅ Mudel laaditud: {MODEL_PATH}")
    else:
        logger.warning(f"⚠️ Mudel'i ei leitud: {MODEL_PATH}")
except Exception as e:
    logger.warning(f"⚠️ Mudeli laadimise viga: {e}")

def prepare_dataframe(klines):
    """Valmistab DataFrame'i indikaatoritega"""
    df = pd.DataFrame(klines, columns=['time','open','high','low','close','volume','_','_','_','_','_','_'])
    df[['open','high','low','close','volume']] = df[['open','high','low','close','volume']].apply(pd.to_numeric)
    
    # Indikaatorid
    df['rsi'] = ta.rsi(df['close'], length=14)
    macd = ta.macd(df['close'])
    df['macd'] = macd.iloc[:,0]
    df['macd_signal'] = macd.iloc[:,2]
    
    bbands = ta.bbands(df['close'], length=20, std=2)
    if bbands is not None:
        df['bb_lower'] = bbands.iloc[:,0]
        df['bb_upper'] = bbands.iloc[:,2]
    
    df['ema50'] = ta.ema(df['close'], length=50)
    df['ema200'] = ta.ema(df['close'], length=200)
    df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=14)
    
    # Valikulised
    try:
        df['vwap'] = ta.vwap(df['high'], df['low'], df['close'], df['volume'])
        stoch = ta.stoch(df['high'], df['low'], df['close'])
        if stoch is not None:
            df['stoch_k'] = stoch.iloc[:,0]
            df['stoch_d'] = stoch.iloc[:,1]
    except Exception as e:
        logger.warning(f"Stoch/VWAP: {e}")
    
    df['market_pressure'] = (df['close'] - df['ema200']) / df['ema200']
    
    return df

def get_prediction(df, window_size=50):
    """Ennustab kasutades mudelt (simplified)"""
    if model is None or len(df) < window_size:
        return None
    
    try:
        features = ['price', 'rsi', 'macd', 'macd_signal', 'vwap', 'stoch_k', 'stoch_d', 'atr', 'ema200', 'market_pressure']
        # Kasutame viimase rea andmeid
        row = df.iloc[-1]
        feature_values = [row.get(f, 0) for f in features]
        
        # Simpliseeritud: kasuta RSI
        rsi = row.get('rsi', 50)
        if rsi > 70:
            return 'SELL'
        elif rsi < 30:
            return 'BUY'
        else:
            return 'HOLD'
    except Exception as e:
        logger.warning(f"Ennustus viga: {e}")
        return 'HOLD'

def run_backtest(hours=500):
    """Jooksutab backtest'i"""
    logger.info(f"🔄 Backtest'i käivitus: {hours} tundi")
    
    if not client:
        logger.error("Binance ühendus pole saadaval!")
        return {"error": "Binance ühendus puudub"}
    
    try:
        # Andmete tõmba
        start_str = f"{hours} hours ago UTC"
        logger.info(f"📊 Andmete tõmba: {start_str}")
        klines = client.get_historical_klines(SYMBOL, '1m', start_str)
        
        if not klines:
            logger.error("Andmeid ei saadud!")
            return {"error": "Andmeid ei saadud Binance'ist"}
        
        logger.info(f"📈 Ridade arv: {len(klines)}")
        
        # DataFrame ettevalmistamine
        df = prepare_dataframe(klines)
        
        # Backtest loop
        trades = []
        holds = 0
        last_buy_price = None
        running_pnl = 0
        
        for i in range(50, len(df)):
            window = df.iloc[:i+1].copy()
            current_price = window.iloc[-1]['close']
            action = get_prediction(window)
            
            if action == 'BUY' and last_buy_price is None:
                last_buy_price = current_price
                trades.append({
                    'type': 'BUY',
                    'price': current_price,
                    'index': i
                })
            elif action == 'SELL' and last_buy_price is not None:
                pnl = ((current_price - last_buy_price) / last_buy_price) * 100
                running_pnl += pnl
                trades.append({
                    'type': 'SELL',
                    'price': current_price,
                    'pnl': pnl,
                    'index': i
                })
                last_buy_price = None
            else:
                holds += 1
        
        # Tulemused
        wins = sum(1 for t in trades if t.get('pnl', 0) > 0)
        losses = sum(1 for t in trades if t.get('pnl', 0) < 0)
        total_trades = len([t for t in trades if t['type'] == 'SELL'])
        
        result = {
            "status": "success",
            "hours_tested": hours,
            "data_points": len(df),
            "total_trades": total_trades,
            "buy_signals": sum(1 for t in trades if t['type'] == 'BUY'),
            "sell_signals": sum(1 for t in trades if t['type'] == 'SELL'),
            "winning_trades": wins,
            "losing_trades": losses,
            "total_pnl": running_pnl,
            "avg_pnl_per_trade": running_pnl / total_trades if total_trades > 0 else 0,
            "win_rate": (wins / total_trades * 100) if total_trades > 0 else 0,
            "price_start": df.iloc[0]['close'],
            "price_end": df.iloc[-1]['close'],
            "price_change_percent": ((df.iloc[-1]['close'] - df.iloc[0]['close']) / df.iloc[0]['close'] * 100),
            "trades": trades[:50]  # Esimesed 50 tehingut
        }
        
        logger.info(f"✅ Backtest lõpetatud")
        logger.info(f"   Tehingud: {total_trades}")
        logger.info(f"   P&L: {running_pnl:.2f}%")
        logger.info(f"   Win Rate: {result['win_rate']:.1f}%")
        
        return result
        
    except Exception as e:
        logger.error(f"Backtest viga: {e}", exc_info=True)
        return {"error": str(e)}

if __name__ == '__main__':
    hours = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    result = run_backtest(hours)
    print(json.dumps(result, indent=2, default=str))
