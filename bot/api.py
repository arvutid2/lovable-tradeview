"""
Trading Bot API Server
Juhtimis- ja monitorimis-API boti jaoks
"""
import os
import sys
import json
import time
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# --- Seadistus ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [API] %(message)s')
logger = logging.getLogger(__name__)

# .env laadimine
env_path = Path(__file__).parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

# --- Globaalne boti staatus ---
BOT_STATE = {
    "running": False,
    "process": None,
    "started_at": None,
    "last_trade": None,
    "total_trades": 0,
    "error": None
}

BOT_SCRIPT = Path(__file__).parent / "bot.py"

@app.route('/api/bot/status', methods=['GET'])
def get_bot_status():
    """Tagastab boti praeguse staatus"""
    try:
        import supabase
        from supabase import create_client
        
        SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            return jsonify({"error": "Supabase seaded puuduvad"}), 400
        
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Tõmbame viimased andmed
        res = supabase_client.table('trade_logs').select('*').order('created_at', desc=True).limit(1).execute()
        last_trade = res.data[0] if res.data else None
        
        # Loeme tehingute arvu
        res = supabase_client.table('trade_logs').select('count').execute()
        total_trades = res.count if hasattr(res, 'count') else 0
        
        return jsonify({
            "running": BOT_STATE["running"],
            "started_at": BOT_STATE["started_at"],
            "last_trade": last_trade,
            "total_trades": total_trades,
            "error": BOT_STATE["error"]
        }), 200
        
    except Exception as e:
        logger.error(f"Status päring viga: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bot/start', methods=['POST'])
def start_bot():
    """Käivitab boti"""
    global BOT_STATE
    
    if BOT_STATE["running"]:
        return jsonify({"error": "Bot on juba käivitatud"}), 400
    
    try:
        if not BOT_SCRIPT.exists():
            return jsonify({"error": f"Bot skripti ei leitud: {BOT_SCRIPT}"}), 404
        
        # Käivitame boti subprotsessina
        BOT_STATE["process"] = subprocess.Popen(
            [sys.executable, str(BOT_SCRIPT)],
            cwd=str(BOT_SCRIPT.parent),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        BOT_STATE["running"] = True
        BOT_STATE["started_at"] = datetime.now().isoformat()
        BOT_STATE["error"] = None
        
        logger.info("✅ Bot käivitatud")
        
        return jsonify({
            "status": "started",
            "started_at": BOT_STATE["started_at"]
        }), 200
        
    except Exception as e:
        logger.error(f"Boti käivitus viga: {e}")
        BOT_STATE["error"] = str(e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/bot/stop', methods=['POST'])
def stop_bot():
    """Peatab boti"""
    global BOT_STATE
    
    if not BOT_STATE["running"] or not BOT_STATE["process"]:
        return jsonify({"error": "Bot ei jooksu"}), 400
    
    try:
        BOT_STATE["process"].terminate()
        BOT_STATE["process"].wait(timeout=5)
        
        BOT_STATE["running"] = False
        BOT_STATE["process"] = None
        BOT_STATE["error"] = None
        
        logger.info("✅ Bot peatatud")
        
        return jsonify({"status": "stopped"}), 200
        
    except subprocess.TimeoutExpired:
        BOT_STATE["process"].kill()
        BOT_STATE["running"] = False
        BOT_STATE["process"] = None
        logger.warning("⚠️ Bot peatatud jõuga")
        return jsonify({"status": "killed"}), 200
        
    except Exception as e:
        logger.error(f"Boti peatamise viga: {e}")
        BOT_STATE["error"] = str(e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/bot/backtest', methods=['POST'])
def run_backtest():
    """Jooksutab backtest'i"""
    try:
        data = request.get_json() or {}
        hours = data.get('hours', 500)
        
        backtest_script = Path(__file__).parent / "backtester.py"
        
        if not backtest_script.exists():
            return jsonify({"error": "Backtest skripti ei leitud"}), 404
        
        logger.info(f"🔄 Backtest'i käivitus: {hours} tundi")
        
        result = subprocess.run(
            [sys.executable, str(backtest_script), str(hours)],
            cwd=str(backtest_script.parent),
            capture_output=True,
            text=True,
            timeout=600
        )
        
        # Proovime sisend parsida JSON-ina
        try:
            output = json.loads(result.stdout)
            return jsonify(output), 200
        except json.JSONDecodeError:
            # Kui JSON pole, tagasta raw output
            return jsonify({
                "status": "completed",
                "output": result.stdout,
                "error": result.stderr if result.returncode != 0 else None
            }), 200
        
    except subprocess.TimeoutExpired:
        logger.error("Backtest timeout")
        return jsonify({"error": "Backtest timeout (üle 10 minuti)"}), 500
    except Exception as e:
        logger.error(f"Backtest viga: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/bot/brain/train', methods=['POST'])
def train_brain():
    """Treenib uue mudeli"""
    try:
        brain_script = Path(__file__).parent / "brain.py"
        
        if not brain_script.exists():
            return jsonify({"error": "Brain skripti ei leitud"}), 404
        
        result = subprocess.run(
            [sys.executable, str(brain_script)],
            cwd=str(brain_script.parent),
            capture_output=True,
            text=True,
            timeout=600
        )
        
        return jsonify({
            "status": "completed",
            "output": result.stdout,
            "error": result.stderr if result.returncode != 0 else None
        }), 200
        
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Treenimine timeout"}), 500
    except Exception as e:
        logger.error(f"Treenimine viga: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    logger.info("🚀 Trading Bot API server käivitumine...")
    app.run(
        host='0.0.0.0',
        port=3001,
        debug=False,
        threaded=True
    )
