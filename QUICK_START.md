# 🚀 Trading Bot - Quick Start Guide

## TL;DR - Kiire Startup (✨ UUENDATUD - Node.js API!)

### 1️⃣ Install Dependencies
```bash
cd /workspaces/lovable-tradeview
npm install
```

### 2️⃣ Start Everything (One Command!)
```bash
npm start
# Käivitab automaatselt:
# ✅ Node.js API server: http://localhost:3001
# ✅ React dashboard: http://localhost:5173
```

### 3️⃣ Browser
Ava: **http://localhost:5173**

**Kas see nii raske oli? 😄 Nüüd kliki nupule ja bot käivitub!**

---

## ✅ Dashboard Features

### Graafikul näed:
- 🟢 **Roheline sümbol** = OST signal (BUY)
- 🔴 **Punane sümbol** = MÜÜK signal (SELL)
- **Hinna joon** = BTC hinda liikumine

### Statistika kaardid:
- 📊 **Kogukasum** - Kõikide tehingute P&L
- 📈 **Võitmiste %** - Win rate
- 💰 **Keskmine Kasum** - Average P&L
- ⚡ **Tehinguid** - Total trades count

### Detailne Analüüs:
- Võit/Kaotus suhe
- Suurim võit ja kaotus
- Parim ja praegune seeria

---

## 🤖 Bot Control Panel

Scroll dashboardi alla näed "Boti Juhtimine" sektsiooni:

---

## ✅ Dashboard Features

### Graafikul näed:
- 🟢 **Roheline sümbol** = OST signal (BUY)
- 🔴 **Punane sümbol** = MÜÜK signal (SELL)
- **Hinna joon** = BTC hinda liikumine

### Statistika kaardid:
- 📊 **Kogukasum** - Kõikide tehingute P&L
- 📈 **Võitmiste %** - Win rate
- 💰 **Keskmine Kasum** - Average P&L
- ⚡ **Tehinguid** - Total trades count

### Detailne Analüüs:
- Võit/Kaotus suhe
- Suurim võit ja kaotus
- Parim ja praegune seeria

---

## 🤖 Bot Control Panel

Scroll dashboardi alla näed "Boti Juhtimine" sektsiooni:

### Nupud:
| Nupp | Funktsioon |
|------|-----------|
| **Käivita** 🟢 | Bot käivitub taustal (Node.js API spawns bot.py) |
| **Peata** 🔴 | Bot peatub turvaliselt |
| **Treeni Mudel** 💜 | XGBoost mudel treenib uutest andmetest |
| **Backtest** 💙 | 500h ajalooliste andmete test |

### Staatus Info:
- **Jooksev / Seisab** - 🟢 Kas bot praegu kaubeleb
- **Tehinguid kokku** - Kogu ajaloo tehsingud
- **Viimane tehing** - Millal viimane ost/müük

---

## 🧪 Backtest Tulemused

Pärast Backtest'i näed:

```
Tehingud: 42          (Mitu SELL signaali)
Võidud/Kaotused: 28/14
Win Rate: 66.7%        (28 võitu / 42 tehingust)
Total P&L: +245.32%    (Kokku kasum)
Keskmine P&L: +5.84%   (Iga tehingu kasum)
Hinna muutus: +12.5%   (BTC hinna muutus)
```

---

## 🔧 K.A (Troubleshooting)

### "API pole jooksul" (API Connection Error)
```
✗ Viga: Node.js API server ei jooksu
✓ Lahendus: 
  npm install (kui pole teinud)
  npm start
```

### "Backtest timeout"
```
✗ Viga: Backtest võttis üle 5 minuti
✓ Lahendus: Proovi väiksema date range'iga
```

### "Supabase error"
```
✗ Viga: Andmebaasiühendus ebaõnnestus
✓ Lahendus: Kontrolli .env faili Supabase URL ja Key
```

### Bot ei käivitu
```
✗ Viga: "Process spawn failed"
✓ Lahendus: 
   - Kontrolli kas bot/bot.py eksisteerib
   - Kontrolli .env failist BINANCE_API_KEY
   - Vahel python3 asemel python
```

---

## 📂 File Structure

```
lovable-tradeview/
├── api-server.js              ✨ Node.js Express API (uus!)
├── src/
│   ├── pages/Index.tsx        Dashboard
│   └── components/dashboard/
│       └── SimpleBotControl.tsx  Bot juhtimine
├── bot/
│   ├── bot.py                 Trading bot
│   ├── brain.py               XGBoost mudel
│   └── backtester.py          Backtest engine
└── package.json
```

---

## 🔌 API Endpoints (Node.js)

## 🔌 API Endpoints (Node.js)

### Bot Kontroll
```
POST /api/bot/start          → Bot käivitub (spawns bot.py)
POST /api/bot/stop           → Bot peatub
GET  /api/bot/status         → Boti staatus (running, uptime, pid)
```

### Backtest & Treenimine
```
POST /api/bot/backtest       → Jooksuta backtester.py
POST /api/bot/brain/train    → Jooksuta brain.py (mudel treenib)
```

### Health
```
GET  /api/health             → API on jooksul
```

---

## 💡 How It Works (uus Node.js arhitektuuri)

```
┌─────────────────────────────────────────────┐
│  Dashboard (React)                          │
│  - Shows charts, stats, signals              │
│  - SimpleBotControl component               │
└────────────┬────────────────────────────────┘
             │ Click button
             ↓
┌─────────────────────────────────────────────┐
│  api-server.js (Node.js)                    │
│  - Receives HTTP requests                   │
│  - Spawns Python subprocesses               │
│  - Manages process lifecycle                │
└────────────┬────────────────────────────────┘
             │
             ├─→ spawn('python bot.py')
             ├─→ spawn('python backtester.py')
             └─→ spawn('python brain.py')
             
             ↓
             
┌─────────────────────────────────────────────┐
│  Supabase (Database)                        │
│  - Stores trade logs                        │
│  - Real-time subscriptions                  │
└─────────────────────────────────────────────┘
```

Bot jookseb taustal ja kirjutab iga tehing Supabase-sse → Dashboard loeb reaalajas.

---

## 🎯 Available Commands

```bash
# Start API + React (recommended)
npm start

# API server ONLY
npm api

# React dev server ONLY
npm dev

# Build for production
npm build
```

---

## 🚀 What's Different from Before?

### ❌ Old (Flask)
- Need to install Python dependencies separately
- Flask port conflicts (3001 already in use)
- Complicated setup with 2+ terminals
- Error-prone for users

### ✅ New (Node.js)
- Everything in `npm install` (Express, CORS, dotenv)
- No more port conflicts (simplified process management)
- Single command: `npm start`
- Cleaner error handling
- Scales better with subprocess management

---

**Last Update:** 25. Feb 2026  
**Version:** 3.0 (Node.js API - Flask Removed!)
