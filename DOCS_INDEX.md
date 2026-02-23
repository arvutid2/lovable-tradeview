# 📚 Complete Documentation Index

## 🚀 For New Users

**Start Here:** [QUICK_START_EE.md](QUICK_START_EE.md)
- Estonian language
- Step-by-step setup
- Visual dashboard guide
- Common commands

## 📋 Getting Started Files

| File | Purpose | For |
|------|---------|-----|
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md) | Full setup status & features | Overview |
| [QUICK_START_EE.md](QUICK_START_EE.md) | 4-step quick start | Beginners |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues & fixes | Debugging |
| [validate_setup.py](validate_setup.py) | Automated validation | Testing |

## 🔧 Technical Documentation

| File | Purpose | For |
|------|---------|-----|
| [API_MANUAL.md](API_MANUAL.md) | Flask API endpoints | Developers |
| [BOT_SETUP.md](BOT_SETUP.md) | Bot configuration | Advanced |
| [FEATURE_OVERVIEW.md](FEATURE_OVERVIEW.md) | All features explained | Reference |

## 💡 Quick Reference

### Command Quick Links

```bash
# Validate setup
python validate_setup.py

# Start Flask API
cd bot && python api.py

# Start Dashboard
npm run dev

# Install Python packages
pip install -r bot/requirements.txt

# Install Node packages
npm install

# Run tests
npm run test
```

### File Quick Links

- **Main Dashboard**: [src/pages/Index.tsx](src/pages/Index.tsx)
- **Portfolio Balance**: [src/components/dashboard/PortfolioBalance.tsx](src/components/dashboard/PortfolioBalance.tsx)
- **Bot Control UI**: [src/components/dashboard/BotControl.tsx](src/components/dashboard/BotControl.tsx)
- **API Server**: [bot/api.py](bot/api.py)
- **Trading Bot**: [bot/bot.py](bot/bot.py)
- **Environment Config**: [.env](.env)

## 📊 Architecture

### Frontend Stack
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Recharts** - Charts & visualization
- **Supabase Client** - Real-time database

### Backend Stack
- **Flask 3.0.0** - REST API
- **Python 3.8+** - Bot engine
- **XGBoost** - ML model
- **Pandas/Pandas-TA** - Data analysis
- **Binance API** - Market data
- **Supabase** - PostgreSQL database

### Data Flow

```
User (Browser)
    ↓ http://localhost:5173
React Dashboard
    ├─ Fetch data: http://localhost:3001/api/bot/...
    ├─ Subscribe: Supabase real-time (portfolio, trade_logs)
    └─ Display: Charts, statistics, bot controls
         ↓
Flask API (port 3001)
    ├─ GET /api/bot/status
    ├─ POST /api/bot/start
    ├─ POST /api/bot/stop
    ├─ POST /api/bot/backtest
    └─ POST /api/bot/brain/train
         ↓
Python Bot (subprocess)
    ├─ Fetch: Binance market data
    ├─ Analyze: RSI, MACD, Bollinger Bands
    ├─ Execute: Buy/Sell orders
    ├─ Log: Update Supabase tables
    └─ Update: Portfolio every 5 minutes
         ↓
Supabase (PostgreSQL)
    ├─ trade_logs table
    ├─ portfolio table
    └─ bot_settings table
```

## 📈 Features Explained

### 1. Real-time Dashboard
- Displays live trading data
- Updates every 10-30 seconds
- Shows portfolio balance
- Displays trading signals visually

### 2. Portfolio Tracking
- Total balance in USDT
- BTC balance
- USDT balance
- Auto-updates every 5 minutes

### 3. Trading Signals
- Buy signals (🟢 green dots)
- Sell signals (🔴 red dots)
- Price chart with indicators
- Technical analysis (RSI, MACD)

### 4. Bot Control
- Start/Stop bot from UI
- Run backtest (historical testing)
- Train ML model
- Monitor bot status

### 5. Statistics
- Win rate percentage
- Profit/Loss analysis
- Winning/losing trades count
- Best streaks
- Largest wins/losses

### 6. Backtesting
- Test strategy on 500 hours of data
- Get accurate P&L figures
- Run without disrupting live trading
- Compare different strategies

## 🔐 Security & Configuration

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
BINANCE_API_KEY=optional_your_binance_key
BINANCE_API_SECRET=optional_your_binance_secret
```

### Database Schema

**trade_logs** table:
```
id (UUID)
price (NUMERIC)
rsi (NUMERIC)
action (TEXT: BUY/SELL/HOLD)
bot_confidence (NUMERIC)
pnl (NUMERIC)
market_pressure (TEXT)
analysis_summary (TEXT)
created_at (TIMESTAMP)
symbol (TEXT)
```

**portfolio** table:
```
id (UUID)
created_at (TIMESTAMP)
total_value_usdt (NUMERIC)
btc_balance (NUMERIC, nullable)
usdt_balance (NUMERIC, nullable)
```

## 🚀 Deployment

### To Docker
```bash
docker build -t trading-dashboard .
docker run -p 5173:5173 -p 3001:3001 trading-dashboard
```

### To Vercel (Frontend)
```bash
npm run build
vercel deploy dist/
```

### To Heroku (Backend)
```bash
heroku login
heroku create my-trading-api
git push heroku main
```

## 📞 Getting Help

### Common Issues

1. **"Portfolio not showing"**
   - Check if data is in Supabase portfolio table
   - Run: `python validate_setup.py`
   - See: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

2. **"API connection error"**
   - Make sure Flask API is running
   - Check: `python api.py` output
   - Verify: `curl http://localhost:3001/api/health`

3. **"Import errors in bot.py"**
   - Install packages: `pip install -r bot/requirements.txt`
   - Check Python version: `python --version` (3.8+)

4. **"Supabase connection failed"**
   - Verify `.env` file has correct credentials
   - Test connection: Check browser console (F12)

### Debug Mode

**Browser Console** (F12):
```javascript
import { supabase } from "@/integrations/supabase/client"
const { data } = await supabase.from('portfolio').select('*').limit(1)
console.log(data)
```

**Flask Debug**:
```bash
cd bot
FLASK_ENV=development python -u api.py
```

**Python Bot Debug**:
```bash
cd bot
python -u bot.py
```

## 📚 Learning Resources

### For React/TypeScript
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)

### For Trading/Finance
- [Technical Analysis](https://en.wikipedia.org/wiki/Technical_analysis)
- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [RSI Indicator](https://www.investopedia.com/terms/r/rsi.asp)

### For Python
- [Python Pandas](https://pandas.pydata.org/)
- [XGBoost](https://xgboost.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)

## 📊 Performance Metrics

Target metrics:
- Dashboard load time: < 2 seconds
- API response time: < 100ms
- Chart update: < 500ms
- Portfolio sync: < 10 seconds

Current metrics:
- Flask response: ~50ms
- Real-time updates: 10-30s interval
- Portfolio updates: Every 5 minutes

## 🎯 FAQ

**Q: How do I start trading?**
A: Click [Käivita] button in the Bot Control section.

**Q: How often does portfolio update?**
A: Every 5 minutes automatically, plus real-time when trades execute.

**Q: Can I test without real money?**
A: Yes! Run Backtest to test on historical data.

**Q: How do I train the model?**
A: Click [Treeneta Mudel] in Bot Control panel.

**Q: Can I control multiple bots?**
A: Current version supports 1 bot. Multi-bot coming soon.

**Q: What's the minimum balance?**
A: No minimum - uses configurable amount in bot.py

**Q: Can I add custom indicators?**
A: Yes, modify bot.py analyze_signals() function.

**Q: How do I enable real Binance trading?**
A: Add API keys to .env file.

---

## 📅 Version History

- **v2.3** (Current) - Portfolio balance display
- **v2.2** - Flask API & bot control from dashboard
- **v2.1** - Backtest functionality
- **v2.0** - Professional dashboard design
- **v1.0** - Initial setup

---

## 📝 Contributing

To submit improvements:
1. Create a branch
2. Make changes
3. Test thoroughly
4. Commit with clear messages
5. Push to GitHub

---

## ⚖️ License

MIT License - See LICENSE file for details

---

## 📞 Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [QUICK_START_EE.md](QUICK_START_EE.md)
3. Read [API_MANUAL.md](API_MANUAL.md)
4. Contact: See project contact info

---

**Last Updated:** February 23, 2026  
**Maintained By:** AI Assistant (GitHub Copilot)  
**Status:** ✅ Ready for Use
