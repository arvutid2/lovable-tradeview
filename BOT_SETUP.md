# Trading Bot Control Panel 🤖

## Mis on muutunud?

Nüüd saad kodulehelt otse hallata oma trading bottit! Dashboard näitab:

### ✅ Reaalajas Boti Kontroll
- **Käivita nupp** - Bot käivitatakse taustal
- **Peata nupp** - Bot peatatakse turvaliselt
- **Staatus indikaator** - Näitab kas bot jookseb
- **Käivitamise aeg** - Millal bot viimati käivitati

### 📊 Boti Staatus Info
- **Tehinguid kokku** - Kõikide ajalooliste tehingute arv
- **Viimane tehing** - Millal viimati osati/müüdi
- **Error log** - Kui midagi läheb valesti, näed siin

### 🧪 Backtester Otsene Jooksutamine
- **Backtest nupp** - Jooksutab 500 tunnise ajalooliste andmete testi
- **Tulemused** - Näidatakse tulemused otse lehel

### 🧠 Mudeli Treenimine
- **Treeni Mudel nupp** - XGBoost mudel treenitakse uutest andmetest
- **Automaatne treenitus** - Kasutab Supabase andmeid

---

## Setup Juhised

### 1. API Serveri Käivitamine

Installeeri Flask ja teised dependenciid:
```bash
cd bot
pip install -r api_requirements.txt
```

Käivita API server:
```bash
python api.py
```

Server jookseb `http://localhost:3001` peal.

### 2. React App'i Käivitamine

Eri terminalisse:
```bash
npm run dev
```

App avab `http://localhost:5173` peal.

### 3. Bot.py Konfiguratsioon

Bot.py käivitab automaatselt, kui klikid "Käivita" nuppu.
Veendu, et bot.py omab nõutavad seaded:
```python
- SUPABASE_URL
- SUPABASE_KEY  
- BINANCE_API_KEY (valikuline, kuid parasvõimalik)
```

---

## API Endpoint'id

API server pakub järgmiseid endpoint'e:

### Bot Kontroll
```
POST /api/bot/start      - Käivita bot
POST /api/bot/stop       - Peata bot
GET  /api/bot/status     - Saada boti staatus
```

### Backtest & Treenimine
```
POST /api/bot/backtest   - Jooksuta backtest'i
POST /api/bot/brain/train - Treeni XGBoost mudel
```

### Health
```
GET  /api/health         - Server staatus
```

---

## Kuidas Kasutada

### 1. Boti Käivitamine
```
1. Avad dashboard kodulehel
2. Skrollid alla "Boti Juhtimine" sektsiooni
3. Klikid "Käivita" nuppu
4. Näed "Jookseb" indikaatorit
5. Andmeid lisandub tabelisse iga tehing
```

### 2. Backtester
```
1. Kliki "Backtest" nuppu
2. Ootad 30-120 sekundit
3. Näed tulemused allpool
```

### 3. Mudeli Treenimine
```
1. Kliki "Treeni Mudel" nuppu
2. Süsteem treenib mudelit viimaste Supabase andmete peal
3. Alert näitab kui lõppes
```

---

## Troubleshooting

### "Cannot connect to localhost:3001"
- Veendu et API server käivitus: `python api.py`
- Kontrolli dass Flask kuulab portil 3001

### "Bot process failed"
- Check bot.py logisid: `tail -f bot_log.log`
- Veendu et `.env` failil on õiged sädeted
- Kontrolli Binance API võtmeid

### "Backtest timeout"
- Backtest võib võtta kuni 5 minutit suurte andmehulkade peal
- Proovi väiksema date range'iga

### Supabase veaad
- Veendu et VITE_SUPABASE_URL ja VITE_SUPABASE_ANON_KEY on `.env` failies
- Check Supabase RLS seadeid - tegevused peavad lubatud olema

---

## Fail Struktuur

```
src/
├── pages/
│   └── Index.tsx           ✅ Main dashboard
├── components/
│   └── dashboard/
│       ├── BotControl.tsx  ✨ Bot juhtimine (NEW)
│       ├── ProfitLossAnalysis.tsx
│       └── ...
bot/
├── api.py                  ✨ API server (NEW)
├── api_requirements.txt    ✨ API dependenciid (NEW)
├── bot.py                  Trading bot
├── brain.py                XGBoost mudel
├── backtester.py          Backtest script
└── requirements.txt        Bot dependenciid
```

---

## Järgmine: Advanced Features

Tulevikus saab lisada:
- 📈 Real-time graafik updates
- 💾 Redis cache boti andmetele
- 🔔 Telegram/Discord notifications
- 📱 Mobile app
- 🎨 Advanced UI tema
- 🔐 User authentication

---

**Loodud:** 23. Feb 2026  
**Versioon:** 2.0 (Bot Control Edition)
