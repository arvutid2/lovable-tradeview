# 🐛 Troubleshooting Guide - Dashboard Andmete Kuvamine

## Problem: Dashboard ei näita balance andmeid

### Lahendus 1: Lisa Test Data Supabase'sse

1. Mine [Supabase Dashboard](https://app.supabase.io) juurde
2. Vali oma projekt
3. Ava **SQL Editor**
4. Kopeeri ja jooksuta see:

```sql
-- Insert test portfolio data
INSERT INTO public.portfolio (id, created_at, total_value_usdt, btc_balance, usdt_balance)
VALUES 
  (
    gen_random_uuid(),
    NOW(),
    47250.50,
    0.5,
    4500.50
  );

-- Verify data
SELECT * FROM public.portfolio ORDER BY created_at DESC LIMIT 1;
```

5. Refresh browser (Cmd+R)
6. Peaksid näitama "Portfelli Bilanss" sektsiooni

---

## Lahendus 2: Käivita Bot (See Uuendab Portfelli Automaatselt)

### Terminal 1 - Flask API
```bash
cd bot
python api.py
```

### Terminal 2 - Bot
```bash
cd bot
python bot.py
```

**Bot uuendab portfelli andmeid iga 5 minuti tagant!**

---

## Lahendus 3: Kontrolli RLS Seadeid

Kui ikka ei näita andmeid, kontrolli Supabase portfolio tabel RLS seadeid:

1. Supabase Dashboard → **Table Editor**
2. Vali `portfolio` tabel
3. Ava **Policies** (paremal üleval)
4. Peaksid nägema neid policies:
   - ✅ "Anyone can view portfolio" (SELECT)
   - ✅ "Anyone can insert portfolio" (INSERT)

Kui pole, loo uued:

```sql
-- READ policy
CREATE POLICY "Anyone can view portfolio"
  ON public.portfolio
  FOR SELECT
  USING (true);

-- INSERT policy  
CREATE POLICY "Anyone can insert portfolio"
  ON public.portfolio
  FOR INSERT
  WITH CHECK (true);
```

---

## Lahendus 4: Kontrolli Supabase URL & Key

Veendu et `.env` failil on õiged seaded:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx.anon.key.xxxxx
```

---

## Lahendus 5: Real-time Subscribtion

Browser console'is (F12 → Console) vaata kas algus errore'd:

```javascript
// Testi Supabase ühendust:
> import { supabase } from "@/integrations/supabase/client"
> await supabase.from('portfolio').select('*').limit(1).execute()
```

Pead nägema JSON massiivi koos portfolio andmetega.

---

## Dashboard Komponendid

### ✅ Mis peaks näitama:

```
┌─────────────────────────────────┐
│ 💰 Portfelli Bilanss           │
├─────────────────────────────────┤
│ Kogu väärtus USDT-s              │
│ $47,250.50                       │ ← Main balance
├──────────────────┬──────────────┤
│ BTC: 0.500000    │ USDT: $4500  │ ← Breakdown
└──────────────────┴──────────────┘
```

### ✅ Mis peaks näitama Trade andmised:

```
┌─────────────────────────────────┐
│ 📊 Hinnaliikumine & Signaalid   │
├─────────────────────────────────┤
│ Graafik + 🟢 OST / 🔴 MÜÜK      │
├─────────────────────────────────┤
│ Viimased Tehingud (tabel)       │
└─────────────────────────────────┘
```

---

## 🔍 Debug Checklist

- [ ] Portfolio tabel olemas Supabase'is
- [ ] RLS policies on lubatud (SELECT, INSERT)
- [ ] `.env` failil on URL ja Key
- [ ] Vähemalt 1 rida portfolio tabelis
- [ ] React app refresh'itud (Cmd+R)
- [ ] Browser console: **no errors**
- [ ] Network tab: `/api/bot/status` returns 200

---

## Info Architecture

```
💾 Supabase Database
├── trade_logs table      ← Bot kirjutab tehinguid
│   ├─ price (hind)
│   ├─ action (BUY/SELL)
│   ├─ pnl (kasum/kaotus)
│   └─ ...
│
└── portfolio table       ← Bot kirjutab iga 5 min
    ├─ total_value_usdt (koguarv)
    ├─ btc_balance (BTC kogus)
    ├─ usdt_balance (USDT likviidsus)
    └─ created_at
         ↓
    React Dashboard
    ├─ PortfolioBalance component
    ├─ Trade graafik
    └─ Statistika
```

---

## 🚦 Fast Fixes

### "Portfolio andmeid ei leitud"
```bash
# Lisa test rida
INSERT INTO portfolio (id, total_value_usdt, btc_balance, usdt_balance)
VALUES (gen_random_uuid(), 50000, 0.5, 5000);
```

### "CORS error"
```
API server pole jooksul!
python api.py  # Terminal 1
```

### "Andmeid ei uuendu"
```
Bot pole käivitatud!
python bot.py  # Terminal 2
# või
Click [Käivita] nuppu dashboard'is
```

---

## 📞 Support Info

Kui ikka probleem, otsige:
1. Browser Console (F12)
2. Network tab (saab API calls)
3. Supabase Logs (Studio → Logs)
4. Bot logs (Terminal kus bot.py jookseb)

---

**Last Updated:** 23. Feb 2026  
**Version:** 2.2
