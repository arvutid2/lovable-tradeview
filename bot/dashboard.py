import streamlit as st
import pandas as pd
from supabase import create_client
import os
from dotenv import load_dotenv
import plotly.graph_objects as go
from datetime import datetime
import time

# --- 1. SEADISTUSED ---
load_dotenv()
st.set_page_config(page_title="AI Trader Live - Futures Mode", layout="wide")

@st.cache_resource
def init_supabase():
    return create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

supabase = init_supabase()

def get_data():
    try:
        response = supabase.table("trade_logs").select("*").order("created_at", desc=True).limit(300).execute()
        df = pd.DataFrame(response.data)
        if not df.empty:
            df['created_at'] = pd.to_datetime(df['created_at'])
            df = df.sort_values('created_at')
        return df
    except Exception as e:
        st.error(f"Andmete viga: {e}")
        return pd.DataFrame()

def calculate_stats(df):
    if df.empty: return 0, 0, 0
    trades_with_pnl = df[df['pnl'] != 0]
    if trades_with_pnl.empty: return 0, 0, 0
    win_rate = (len(trades_with_pnl[trades_with_pnl['pnl'] > 0]) / len(trades_with_pnl)) * 100
    max_profit = df['pnl'].max()
    max_loss = df['pnl'].min()
    return win_rate, max_profit, max_loss

# --- 3. PEALEHT ---
st.title("🤖 AI Futures Trader - Live")

# --- KÜLGRIBA (SIIN ON MUUDATUSED) ---
st.sidebar.header("💰 Portfelli seaded")
initial_capital = st.sidebar.number_input("Algnurk ($)", value=1000.0)

st.sidebar.markdown("---")
st.sidebar.header("🛡️ Riskijuhtimine")

# Loeme riski uuest tabelist 'risk_management'
try:
    risk_res = supabase.table("risk_management").select("risk_percent").eq("id", 1).execute()
    if risk_res.data:
        current_risk_val = float(risk_res.data[0]['risk_percent'])
    else:
        # Kui tabel on tühi, tekitame algse rea
        supabase.table("risk_management").insert({"id": 1, "risk_percent": 100.0}).execute()
        current_risk_val = 100.0
except:
    current_risk_val = 100.0

# Slider riski muutmiseks
new_risk_val = st.sidebar.slider("Kasuta rahakotist (%)", 1, 100, int(current_risk_val))

if st.sidebar.button("Salvesta riski tase"):
    supabase.table("risk_management").update({"risk_percent": new_risk_val}).eq("id", 1).execute()
    st.sidebar.success(f"Uus risk: {new_risk_val}%")
    time.sleep(1)
    st.rerun()

st.sidebar.markdown("---")
# --- KÜLGRIBA LÕPP ---

df = get_data()

if not df.empty:
    latest = df.iloc[-1]
    win_rate, max_p, max_l = calculate_stats(df)
    
    # --- MEETRIKA PLOKK ---
    m1, m2, m3, m4 = st.columns(4)
    pnl_pct = latest.get('pnl', 0)
    current_wallet = initial_capital * (1 + (pnl_pct / 100))
    
    m1.metric("BTC Hind", f"${latest['price']:.2f}")
    m2.metric("Rahakott", f"${current_wallet:.2f}", f"{pnl_pct:.2f}%")
    m3.metric("Boti Win Rate", f"{win_rate:.1f}%")
    m4.metric("Parim tehing", f"{max_p:.2f}%")

    # --- AI OLUKORRA ANALÜÜS ---
    col_a, col_b = st.columns([1, 2])
    with col_a:
        rsi = latest.get('rsi', 50)
        if rsi < 30: st.success("🎯 TUGEV OSTUSIGNAAL")
        elif rsi > 70: st.error("⚠️ ÜLEMÜÜDUD - ETTEVAATUST")
        else: st.warning("⚖️ TURG ON TASAKAALUS")

    with col_b:
        conf = latest.get('bot_confidence', 0) * 100
        action = latest['action']
        msg = f"AI on **{conf:.0f}% kindel**. Positsioon: {action}"
        st.info(f"🧠 **Boti strateegia:** {msg}")

    # --- GRAAFIKUD ---
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df['created_at'], y=df['price'], name="BTC", line=dict(color='#00ff00', width=2)))
    
    buys = df[df['action'] == 'LONG']
    shorts = df[df['action'] == 'SHORT']
    fig.add_trace(go.Scatter(x=buys['created_at'], y=buys['price'], mode='markers', name='LONG', marker=dict(symbol='triangle-up', size=12, color='cyan')))
    fig.add_trace(go.Scatter(x=shorts['created_at'], y=shorts['price'], mode='markers', name='SHORT', marker=dict(symbol='triangle-down', size=12, color='magenta')))
    fig.update_layout(template="plotly_dark", height=450)
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Kasumi kõver (PNL %)")
    fig_pnl = go.Figure(go.Scatter(x=df['created_at'], y=df['pnl'], fill='tozeroy', line=dict(color='#00d1ff')))
    fig_pnl.update_layout(template="plotly_dark", height=250)
    st.plotly_chart(fig_pnl, use_container_width=True)

    with st.expander("Vaata detailseid tehingute logisid"):
        st.dataframe(df[['created_at', 'action', 'price', 'avg_entry_price', 'pnl', 'bot_confidence']].tail(20), use_container_width=True)

else:
    st.warning("Ootan andmeid...")

time.sleep(60)
st.rerun()