# 🚀 Kiirstart - Trading Dashboard

## Step-by-Step Setup

### 1️⃣ Kontrolli .env Seadeid

Ava `.env` fail juurkaustalas ja veendu, et seal on:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

❌ Kui puudub: Mine [Supabase Dashboard](https://app.supabase.io) juurde ja kopeeri URL + Anon Key

---

### 2️⃣ Käivita Flask API Server (Terminal 1)

```bash
cd bot
pip install -r requirements.txt
python api.py
```

✅ Peaks näitama:
```
 * Running on http://127.0.0.1:3001
```

---

### 3️⃣ Käivita React Dashboard (Terminal 2)

```bash
npm install
npm run dev
```

✅ Peaks näitama:
```
  ➜  Local:   http://localhost:5173/
```

---

### 4️⃣ Avage Browser

**http://localhost:5173**

---

## 📊 Dashboard Kasutamine

### A) Lisa Test Portfolio Data

1. Ava browser: **http://localhost:5173**
2. Ava [Supabase Dashboard](https://app.supabase.io)
3. Vali oma projekt
4. **SQL Editor** → Kopeeri järgmine:

```sql
-- Lisa test andmed portfoliole
INSERT INTO public.portfolio (id, created_at, total_value_usdt, btc_balance, usdt_balance)
VALUES (gen_random_uuid(), NOW(), 47250.50, 0.5, 4500.50);
```

5. **Refresh** browser (Cmd+R / Ctrl+R)
6. ✅ Peaksid nägema "💰 Portfelli Bilanss" sektsiooni!

---

### B) Käivita Bot (Trading)

**Dashboard'is:**
1. Leia "🤖 Boti Juhtimine" sektsioon
2. Kliki **[Käivita]** nuppu
3. ✅ Staatus muutub → "🟢 Jooksev"
4. Bot alustab automaatselt:
   - Turul andmete lugemist
   - Signaalide analüüsimist  
   - Tehingute tegemist
   - Portfolio uuendamist iga 5 minutiga

---

### C) Jooksuta Backtest

**Dashboard'is:**
1. Leia "🤖 Boti Juhtimine" sektsioon
2. Kliki **[Backtest]** nuppu
3. Oota ~30-60 sekundit
4. ✅ Näed tulemused:
   - Kogukasuum/Kaotus
   - Võidu protsent
   - Keskmised näitajad

---

### D) Treeneta AI Mudelit

**Dashboard'is:**
1. Leia "🤖 Boti Juhtimine" sektsioon
2. Kliki **[Treeneta Mudel]** nuppu
3. Oota ~2-5 minutit
4. ✅ Model'i täpsus paraneb!

---

## 📈 Mida Dashboard Näitab

```
┌─────────────────────────────────────────────────────┐
│ 📊 TRADING DASHBOARD                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 💰 Portfelli Bilanss                                │
│ ┌──────────────────────────────────────────────┐    │
│ │ Kogu väärtus: $47,250.50                     │    │
│ │ BTC: 0.50  |  USDT: $4,500.50                │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ 📊 Hinnaliikumine & Signaalid                       │
│ ┌──────────────────────────────────────────────┐    │
│ │ [Graafik]  🟢 OST  🔴 MÜÜK                   │    │
│ │ Ajavahemik: Viimased 200 tehing             │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ 📋 Viimased Tehingud                               │
│ ┌──────────────────────────────────────────────┐    │
│ │ Hind   │ Tehing │ P&L     │ RSI   │ Aeg     │    │
│ │ 65320  │ BUY    │ +250.50 │ 28    │ 14:32   │    │
│ │ 65450  │ SELL   │ +180.25 │ 72    │ 15:44   │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ 🤖 Boti Juhtimine                                   │
│ [Käivita] [Peata] [Treeneta Mudel] [Backtest]      │
│                                                      │
│ 📊 Väljundid                                        │
│ Kokku Tulemus: 18 OST | 17 MÜÜK | Kasuum: $2,150   │
│ Võidu %: 65.2% | Parima rida: 5 OST                │
└─────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### ❌ "Portfolio andmeid ei näita"

```bash
# Lisa test data Supabase SQL Editor'is:
INSERT INTO portfolio (id, total_value_usdt, btc_balance, usdt_balance)
VALUES (gen_random_uuid(), 50000, 0.5, 5000);

# Seejärel refresh browser
```

### ❌ "API Connection Error"

```bash
# Veendu Flask server jookseb:
cd bot && python api.py
# Peaks näitama: Running on http://127.0.0.1:3001
```

### ❌ "Import errors bot/bot.py failis"

```bash
# Paigalda Python dependencies:
cd bot
pip install -r requirements.txt
```

### ❌ "Supabase connection error"

```bash
# Veendu .env seadeid:
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Kui tühjad, lisa .env faili
```

---

## 📁 Projekti Struktuur

```
lovable-tradeview/
├── src/
│   ├── pages/
│   │   └── Index.tsx          ← Main dashboard
│   ├── components/
│   │   └── dashboard/
│   │       ├── PortfolioBalance.tsx    ← Balance näitab
│   │       ├── PriceChart.tsx          ← Buy/Sell signaalid
│   │       ├── BotControl.tsx          ← Bot juhtimis nuppe
│   │       └── ProfitLossAnalysis.tsx  ← Statistika
│   └── hooks/
│       ├── useTradeData.ts
│       └── usePortfolioData.ts
│
├── bot/
│   ├── api.py                 ← Flask server (port 3001)
│   ├── bot.py                 ← Trading bot (run'ime subprocessina)
│   ├── backtester.py          ← Backtest engine
│   ├── brain.py               ← ML model trainer
│   └── requirements.txt        ← Python dependencies
│
├── supabase/
│   ├── migrations/             ← DB schema
│   └── config.toml
│
└── .env                       ← Supabase URL + Key
```

---

## 🔄 Andmevoog

```
┌─────────────────────────────────────────────────┐
│ 1. Bot (bot.py) - Jookseb Terminal'is          │
│    ├─ Loeb Binance API andmeid                  │
│    ├─ Analüüsib RSI/MACD signaalid              │
│    ├─ Kirjutab tech. andmeid → Supabase         │
│    └─ Uuendab portfolio iga 5 min               │
└─────────────────────────────────────────────────┘
           ↓ Supabase Real-time ↓
┌─────────────────────────────────────────────────┐
│ 2. React Dashboard (localhost:5173)             │
│    ├─ Loeb trade_logs tabelist                  │
│    ├─ Loeb portfolio tabelist                   │
│    ├─ Kuva graafik + statistika                 │
│    └─ Näita Buy/Sell signaale                   │
└─────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

✅ **Auto-refresh**: Dashboard uuendab andmeid iga 10-30 sekundit

✅ **Real-time**: Kasutab Supabase postgre_changes subscriptioneid

✅ **Portfolio uuendus**: Bot kirjutab portfolio andmeid iga 5 minuti tagant

✅ **Backtest**: Testimist saab teha millal tahes (ei sega bot'i)

✅ **Model training**: Treening käivitub taustal ja ei peeota tehinguid

---

## 📞 Debugging

**Browser Console (F12):**
```javascript
// Test Supabase connection:
import { supabase } from "@/integrations/supabase/client"
const { data, error } = await supabase.from('portfolio').select('*')
console.log(data, error)
```

**Bot Logs:**
```bash
# Terminal kus bot.py jookseb - vaata real-time logisid
```

**Python Errors:**
```bash
# Kui import errors, kontrolli pip:
pip install -r requirements.txt
```

---

## ✅ Checklist - Enne Kasutamist

- [ ] `.env` failil on VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- [ ] `pip install -r bot/requirements.txt` jooksete
- [ ] `npm install` jooksete
- [ ] Flask server jookseb (python api.py)
- [ ] React app jookseb (npm run dev)
- [ ] Browser avanevad http://localhost:5173
- [ ] Supabase portfolio tabel olemas + RLS lubatud
- [ ] Test andmed lisatud portfolio tabelisse

---

## 🎯 Järgmised sammud

1. ✅ Dashboard avada (localhost:5173)
2. ✅ Portfolio test andmeid lisada
3. ✅ Bot käivitada [Käivita] nupp
4. ✅ Odata 5+ minutit ... bot uuendab portfolio andmeid
5. ✅ Vaatada balance näitaja
6. ✅ Käivitada backtest või model training
7. ✅ Nautida trading bot'i monitorimist! 🚀

---

**Created:** 23. Feb 2026  
**Updated:** AI Auto-Setup  
**Status:** Ready to Use
