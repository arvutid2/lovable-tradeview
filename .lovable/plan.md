

# Crypto Trading Bot Dashboard 🚀

## Overview
A real-time, cyberpunk-styled crypto trading dashboard that connects to your existing Supabase `trade_logs` table and updates live as your Python bot inserts new data.

---

## Step 1: Connect Supabase
Before building, we'll need to connect your Supabase project (where `trade_logs` lives). You'll be prompted to set this up.

**Table schema expected:**
- `price` (numeric) — BTC price
- `rsi` (numeric) — RSI indicator value
- `action` (text) — BUY / SELL / HOLD
- `analysis_summary` (text) — AI analysis text
- `created_at` (timestamp) — when the row was inserted
- `symbol` (text) — trading pair

---

## Step 2: Dark Cyberpunk Theme
- Deep black background with subtle grid/glow effects
- Neon green for BUY/profit, electric red for SELL, amber for HOLD
- Glassmorphism cards with subtle blur and border glow
- JetBrains Mono / Inter fonts for that terminal aesthetic

---

## Step 3: Hero Stats Row (Top)
Three large glowing cards:
1. **Current BTC Price** — Big bold number, real-time updates
2. **RSI Gauge** — Circular progress bar showing latest RSI (0-100), color-coded by zone (oversold/overbought)
3. **Current Signal** — Large BUY/SELL/HOLD badge with pulsing glow animation matching the action color

---

## Step 4: Price History Chart (Middle)
- Interactive line chart (Recharts) plotting `price` over `created_at`
- Dark themed with neon accent lines
- Tooltips showing price, RSI, and action at each point
- BUY/SELL markers on the chart as colored dots

---

## Step 5: Signals Log Table (Bottom Left)
- Scrollable table showing the last 20 entries
- Columns: Time, Price, Action (color-coded badge), Symbol
- Auto-updates when new rows arrive via Supabase Realtime

---

## Step 6: AI Insight Feed (Bottom Right)
- Dedicated card displaying the latest `analysis_summary`
- Styled like a live "AI thinking" terminal feed
- Shows the most recent analysis with a typing/glow effect

---

## Step 7: Real-Time Engine
- Supabase Realtime subscription on `trade_logs` table
- All components (stats, chart, table, AI feed) update instantly when a new row is inserted — no page refresh

---

## Step 8: Mobile Responsive
- Cards stack vertically on mobile
- Chart remains interactive and readable
- Table becomes a scrollable card list on small screens
- Easy to check bot status on the go

