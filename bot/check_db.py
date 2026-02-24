import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Laeme seaded
env_path = Path(__file__).parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

def check_columns():
    try:
        supabase = create_client(URL, KEY)
        # Tõmbame ühe rea, et näha veergusid
        res = supabase.table("trade_logs").select("*").limit(1).execute()
        
        if not res.data:
            print("⚠️ Tabel 'trade_logs' on tühi, ei saa veerge kontrollida.")
            return

        existing_columns = res.data[0].keys()
        
        # Need on veerud, mida bot.py (V3.3.1) üritab saata
        required_columns = [
            'symbol', 'action', 'price', 'position_side', 'entry_count', 
            'avg_entry_price', 'rsi', 'macd', 'macd_signal', 'bb_upper', 
            'bb_lower', 'stoch_k', 'stoch_d', 'atr', 'ema200', 'vwap', 
            'volume', 'pnl', 'analysis_summary', 'market_pressure', 
            'ai_prediction', 'bot_confidence', 'fear_greed_index'
        ]

        print(f"🔍 Kontrollin tabelit 'trade_logs'...")
        missing = []
        for col in required_columns:
            if col not in existing_columns:
                missing.append(col)
        
        if missing:
            print(f"❌ PUUDUVAD VEERUD: {missing}")
            print("\n💡 Mine Supabase -> Table Editor -> trade_logs ja lisa need veerud (tüüp: float8 või int8).")
        else:
            print("✅ KÕIK OK! Kõik botile vajalikud veerud on tabelis olemas.")

    except Exception as e:
        print(f"❌ Viga ühenduses: {e}")

if __name__ == "__main__":
    check_columns()