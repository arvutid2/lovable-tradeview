"""
🚀 Optional Streamlit Dashboard (Development Only)

This file is optional and not required for the main application.
The React dashboard (localhost:5173) is the primary UI.

To use this Streamlit dashboard, install: pip install streamlit plotly
Then run: streamlit run dashboard.py
"""

import pandas as pd
from supabase import create_client
import os
from dotenv import load_dotenv

try:
    import streamlit as st  # type: ignore
    import plotly.graph_objects as go  # type: ignore
except ImportError:
    print("Streamlit ja Plotly pole installiga. Valikuline - React app töötab ilma nendeta.")

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

st.set_page_config(page_title="AI Crypto Bot Dashboard", layout="wide")
st.title("🤖 AI Trading Bot V2 - Real-time Analysis")

# 1. Tõmba andmed
res = supabase.table("trade_logs").select("*").order("created_at", desc=True).limit(50).execute()
df = pd.DataFrame(res.data)

# 2. Peamised indikaatorid (KPI-d)
curr = df.iloc[0]
col1, col2, col3, col4 = st.columns(4)
col1.metric("Current Price", f"${curr['price']:,}")
col2.metric("AI Confidence", f"{curr['ai_prediction']*100:.1f}%")
col3.metric("RSI", f"{curr['rsi']:.1f}")
col4.metric("Market Pressure", f"{curr['market_pressure']:.2f}")

# 3. AI Ennustuse graafik
fig = go.Figure()
fig.add_trace(go.Scatter(x=df['created_at'], y=df['ai_prediction'], name="AI Confidence", line=dict(color='gold')))
st.plotly_chart(fig, use_container_width=True)

# 4. Tabel viimaste logidega
st.subheader("Viimased tehingud ja analüüs")
st.write(df[['created_at', 'action', 'price', 'analysis_summary', 'pnl']])