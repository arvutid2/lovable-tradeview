# API Server Manual

## Setup

### Installeerimine
```bash
cd bot
pip install -r api_requirements.txt
```

### Käivitamine
```bash
python api.py
```

Server kuulab pordil **3001**.

---

## Environment Variables

Vajalikud seaded `.env` failist:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx

# Binance (valikuline, kuid soovituslik)
BINANCE_API_KEY=xxxxx
BINANCE_API_SECRET=xxxxx
```

---

## API Endpoints

### GET /api/health
Health check.
```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{"status": "ok"}
```

---

### GET /api/bot/status
Boti praeguse staatus.

```bash
curl http://localhost:3001/api/bot/status
```

**Response:**
```json
{
  "running": false,
  "started_at": null,
  "last_trade": {
    "id": "uuid",
    "price": 45000,
    "action": "BUY",
    "pnl": 2.5,
    "created_at": "2026-02-23T12:00:00"
  },
  "total_trades": 42,
  "error": null
}
```

---

### POST /api/bot/start
Käivitab boti.

```bash
curl -X POST http://localhost:3001/api/bot/start
```

**Response:**
```json
{
  "status": "started",
  "started_at": "2026-02-23T15:30:45.123456"
}
```

---

### POST /api/bot/stop
Peatab boti.

```bash
curl -X POST http://localhost:3001/api/bot/stop
```

**Response:**
```json
{"status": "stopped"}
```

---

### POST /api/bot/backtest
Jooksutab backtest'i.

**Request:**
```bash
curl -X POST http://localhost:3001/api/bot/backtest \
  -H "Content-Type: application/json" \
  -d '{"hours": 500}'
```

**Response:**
```json
{
  "status": "success",
  "hours_tested": 500,
  "data_points": 30000,
  "total_trades": 42,
  "buy_signals": 45,
  "sell_signals": 42,
  "winning_trades": 28,
  "losing_trades": 14,
  "total_pnl": 245.32,
  "avg_pnl_per_trade": 5.84,
  "win_rate": 66.7,
  "price_start": 42000,
  "price_end": 47250,
  "price_change_percent": 12.5,
  "trades": [...]
}
```

---

### POST /api/bot/brain/train
Treenib mudelet.

```bash
curl -X POST http://localhost:3001/api/bot/brain/train
```

**Response:**
```json
{
  "status": "completed",
  "output": "✅ Mudel treenitud edukalt!",
  "error": null
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request õnnestus |
| 400 | Bad Request - Vigane sisend |
| 404 | Not Found - Fail/Endpoint puudub |
| 500 | Server Error - Tegevus ebaõnnestus |

---

## Debug Mode

Logi tasemete muutmiseks:

```python
# api.py juures
logging.basicConfig(level=logging.DEBUG)  # Rohkem logisid
```

---

## Performance

- **Backtest'i timeout:** 10 minutit (600 sekundi)
- **Status polling:** 5 sekundit
- **Max data points:** ~30000 rea (500 tundi × 60 min)

---

## Troubleshoot

### "Address already in use"
```
Port 3001 on juba kasutusel.
Lahendus: 
  - Leia protsess: lsof -i :3001
  - Tapa: kill -9 <PID>
  - Või kasuta erinevat porti: app.run(port=3002)
```

### "ModuleNotFoundError: No module named 'flask'"
```
Lahendus: pip install -r api_requirements.txt
```

### Bot process failed
```
Check bot.py logisid: tail -f bot_log.log
Vaata errori detaile /api/bot/status endpoint'is
```

---

## Architecture

```
┌─────────────────────┐
│   React Dashboard   │
└──────────┬──────────┘
           │ fetch()
           ↓
┌──────────────────────┐
│   Flask API Server   │ ← port 3001
├──────────────────────┤
│ • /api/bot/status    │
│ • /api/bot/start     │
│ • /api/bot/stop      │
│ • /api/bot/backtest  │
│ • /api/bot/brain/train
└──────────┬───────────┘
           │ subprocess / requests
      ┌────┴─────┬──────────┬──────────┐
      ↓          ↓          ↓          ↓
   [bot.py]  [brain.py] [backtester] [supabase]
```

---

## Logs

API server logib kõik tegevused `-` formaadis:

```
2026-02-23 15:30:45,123 - [API] 🚀 Trading Bot API server käivitumine...
2026-02-23 15:30:50,456 - [API] ✅ Bot käivitatud
2026-02-23 15:35:12,789 - [API] 🔄 Backtest'i käivitus: 500 tundi
```

---

**Version:** 1.0  
**Last Update:** 23. Feb 2026
