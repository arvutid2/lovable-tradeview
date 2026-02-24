import streamlit as st
import pandas as pd
from supabase import create_client
import os
from dotenv import load_dotenv
import plotly.graph_objects as go
from datetime import datetime

# --- 1. SEADISTUSED ---
load_dotenv()
st.set_page_config(page_title="AI Trader Live", layout="wide")

@st.cache_resource
def init_supabase():
    return create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

supabase = init_supabase()

def get_data():
    try:
        response = supabase.table("trade_logs").select("*").order("created_at", desc=True).limit(150).execute()
        df = pd.DataFrame(response.data)
        if not df.empty:
            df['created_at'] = pd.to_datetime(df['created_at'])
            # Sorteerime ajaliselt õigeks
            df = df.sort_values('created_at')
        return df
    except Exception as e:
        st.error(f"Andmete viga: {e}")
        return pd.DataFrame()

# --- 2. PEALEHT ---
st.title("🤖 Minu AI Kauplemisassistent")

# Külgriba
st.sidebar.header("💰 Sinu virtuaalne rahakott")
initial_capital = st.sidebar.number_input("Millega alustasid? ($)", value=1000.0)
st.sidebar.markdown("---")
st.sidebar.write("See bot analüüsib turgu iga minut ja teeb otsuseid sinu eest.")

df = get_data()

if not df.empty:
    latest = df.iloc[-1]
    
    # --- VALGUSFOOR JA AI SELGITUS ---
    col_a, col_b = st.columns([1, 2])
    
    with col_a:
        # Lihtne valgusfoor
        rsi = latest.get('rsi', 50)
        if rsi < 35:
            st.success("🟢 TURG: OSTUALAS (Odav)")
        elif rsi > 65:
            st.error("🔴 TURG: MÜÜGIALAS (Kallis)")
        else:
            st.warning("🟡 TURG: OOTEL (Rahulik)")

    with col_b:
        # AI "Inimkeelne" selgitus
        conf = latest.get('ai_prediction', 0) * 100
        action = latest['action']
        if action == "LONG":
            msg = f"AI on **{conf:.0f}% kindel**, et hind tõuseb. Hoiame või ostame!"
        elif action == "SHORT":
            msg = f"AI näeb langust (kindlus **{conf:.0f}%**). Parem on olla rahas."
        else:
            msg = "AI ei ole kindel. Parem ootame ja vaatame."
        st.info(f"🧠 **Boti mõte:** {msg}")

    # --- MEETRIKA ---
    m1, m2, m3 = st.columns(3)
    pnl_pct = latest.get('pnl', 0)
    current_wallet = initial_capital * (1 + (pnl_pct / 100))
    
    m1.metric("BTC Hetkehind", f"${latest['price']:.2f}")
    m2.metric("Sinu rahakott", f"${current_wallet:.2f}", f"{pnl_pct:.2f}%")
    m3.metric("AI Enesekindlus", f"{conf:.1f}%")

    # --- PÕHIGRAAFIK KOOS MÄRKIDEGA ---
    st.subheader("Hinnagraafik (Kuhu bot märgid jättis?)")
    
    fig = go.Figure()

    # 1. Hinnajoon
    fig.add_trace(go.Scatter(x=df['created_at'], y=df['price'], name="BTC Hind", line=dict(color='#00ff00', width=2)))
    
    # 2. VWAP (Keskmine hind)
    fig.add_trace(go.Scatter(x=df['created_at'], y=df['vwap'], name="Keskmine tase", line=dict(color='orange', dash='dot')))

    # 3. LISAME OSTU JA MÜÜGI MÄRGID
    # Leiame kohad, kus bot tegi otsuse (LONG vs SHORT)
    buys = df[df['action'] == 'LONG']
    sells = df[df['action'] == 'SHORT']

    fig.add_trace(go.Scatter(
        x=buys['created_at'], y=buys['price'],
        mode='markers', name='AI OSTIS',
        marker=dict(symbol='triangle-up', size=12, color='cyan', line=dict(width=2))
    ))

    fig.add_trace(go.Scatter(
        x=sells['created_at'], y=sells['price'],
        mode='markers', name='AI MÜÜS',
        marker=dict(symbol='triangle-down', size=12, color='magenta', line=dict(width=2))
    ))

    fig.update_layout(template="plotly_dark", height=500, margin=dict(l=0, r=0, t=0, b=0))
    st.plotly_chart(fig, use_container_width=True)

    # --- KASUMIGRAAFIK ---
    st.subheader("Sinu raha kasv ajas")
    df['wallet_history'] = initial_capital * (1 + (df['pnl'] / 100))
    fig_w = go.Figure(go.Scatter(x=df['created_at'], y=df['wallet_history'], fill='tozeroy', line=dict(color='#00d1ff')))
    fig_w.update_layout(template="plotly_dark", height=300)
    st.plotly_chart(fig_w, use_container_width=True)

    # --- VIIMASED LOGID ---
    with st.expander("Vaata boti täpseid märkmeid (Logid)"):
        st.table(df[['created_at', 'action', 'price', 'analysis_summary']].tail(10))

else:
    st.warning("Andmeid veel pole. Pane bot.py tööle!")

if st.button("Värskenda andmeid"):
    st.rerun()