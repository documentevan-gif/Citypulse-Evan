"""
================================================================================
CivicAI Kalteng: Dashboard Analisis Aspirasi & Social Network Analysis (SNA)
Provinsi Kalimantan Tengah (13 Kabupaten & 1 Kota)
================================================================================
Author : Senior Data Engineer & Front-End Dashboard Developer
Stack  : Python, Streamlit, Pandas, NetworkX, Plotly
"""

import re
from typing import Dict, List, Tuple
import networkx as nx
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ==============================================================================
# 1. KONFIGURASI HALAMAN & TEMA (ELEGANT DARK)
# ==============================================================================
st.set_page_config(
    page_title="CivicAI Kalteng - SNA & Regional Dashboard",
    page_icon="🌐",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Injeksi CSS Kustom: Tema "Elegant Dark" (Palet #0F0F12, #1A1B1F, #4F9CF9)
st.markdown(
    """
<style>
    /* Global Background & Typography */
    .stApp {
        background-color: #0F0F12;
        color: #E5E7EB;
        font-family: 'Inter', -apple-system, sans-serif;
    }
    
    /* Card Panel Styling */
    div[data-testid="metric-container"] {
        background-color: #1A1B1F;
        border: 1px solid #31333A;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    
    /* Header & Badge Styling */
    .kalteng-badge {
        display: inline-block;
        background: linear-gradient(90deg, #4F9CF9, #34D399);
        color: #0F0F12;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    
    .panel-box {
        background-color: #1A1B1F;
        border: 1px solid #31333A;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #141519;
        border-right: 1px solid #31333A;
    }
    
    /* Table Styling */
    .dataframe {
        background-color: #1A1B1F !important;
        color: #E5E7EB !important;
        border: 1px solid #31333A !important;
    }
</style>
""",
    unsafe_allow_html=True,
)

# ==============================================================================
# 2. MASTER DATA KALIMANTAN TENGAH (13 KABUPATEN + 1 KOTA)
# ==============================================================================
# Daftar resmi 14 daerah administratif Provinsi Kalimantan Tengah
KALTENG_REGIONS: List[str] = [
    "Kota Palangka Raya",
    "Kabupaten Barito Selatan",
    "Kabupaten Barito Timur",
    "Kabupaten Barito Utara",
    "Kabupaten Gunung Mas",
    "Kabupaten Kapuas",
    "Kabupaten Katingan",
    "Kabupaten Kotawaringin Barat",
    "Kabupaten Kotawaringin Timur",
    "Kabupaten Lamandau",
    "Kabupaten Murung Raya",
    "Kabupaten Pulang Pisau",
    "Kabupaten Sukamara",
    "Kabupaten Seruyan",
]

# Pengelompokan Koridor Pembangunan Kalteng untuk filter cepat
KORIDOR_MAP = {
    "Koridor Tengah & Ibukota": [
        "Kota Palangka Raya",
        "Kabupaten Katingan",
        "Kabupaten Gunung Mas",
        "Kabupaten Pulang Pisau",
    ],
    "Koridor Pesisir & Selatan": [
        "Kabupaten Kapuas",
        "Kabupaten Pulang Pisau",
        "Kabupaten Seruyan",
    ],
    "Koridor Barat (Industri/Pelabuhan)": [
        "Kabupaten Kotawaringin Barat",
        "Kabupaten Kotawaringin Timur",
        "Kabupaten Lamandau",
        "Kabupaten Sukamara",
        "Kabupaten Seruyan",
    ],
    "Koridor DAS Barito (Hulu ke Hilir)": [
        "Kabupaten Murung Raya",
        "Kabupaten Barito Utara",
        "Kabupaten Barito Selatan",
        "Kabupaten Barito Timur",
    ],
}

# Kamus sinonim & variasi penulisan nama wilayah untuk standardisasi/pembersihan data
REGION_SYNONYMS: Dict[str, str] = {
    "palangkaraya": "Kota Palangka Raya",
    "palangka raya": "Kota Palangka Raya",
    "kota palangka raya": "Kota Palangka Raya",
    "barsel": "Kabupaten Barito Selatan",
    "barito selatan": "Kabupaten Barito Selatan",
    "buntok": "Kabupaten Barito Selatan",
    "bartim": "Kabupaten Barito Timur",
    "barito timur": "Kabupaten Barito Timur",
    "tamiang layang": "Kabupaten Barito Timur",
    "barut": "Kabupaten Barito Utara",
    "barito utara": "Kabupaten Barito Utara",
    "muara teweh": "Kabupaten Barito Utara",
    "gumas": "Kabupaten Gunung Mas",
    "gunung mas": "Kabupaten Gunung Mas",
    "kuala kurun": "Kabupaten Gunung Mas",
    "kapuas": "Kabupaten Kapuas",
    "kuala kapuas": "Kabupaten Kapuas",
    "katingan": "Kabupaten Katingan",
    "kasongan": "Kabupaten Katingan",
    "kobar": "Kabupaten Kotawaringin Barat",
    "kotawaringin barat": "Kabupaten Kotawaringin Barat",
    "pangkalan bun": "Kabupaten Kotawaringin Barat",
    "kotim": "Kabupaten Kotawaringin Timur",
    "kotawaringin timur": "Kabupaten Kotawaringin Timur",
    "sampit": "Kabupaten Kotawaringin Timur",
    "lamandau": "Kabupaten Lamandau",
    "nanga bulik": "Kabupaten Lamandau",
    "mura": "Kabupaten Murung Raya",
    "murung raya": "Kabupaten Murung Raya",
    "puruk cahu": "Kabupaten Murung Raya",
    "pulpis": "Kabupaten Pulang Pisau",
    "pulang pisau": "Kabupaten Pulang Pisau",
    "sukamara": "Kabupaten Sukamara",
    "seruyan": "Kabupaten Seruyan",
    "kuala pembuang": "Kabupaten Seruyan",
}

# Estimasi koordinat spasial relatif wilayah Kalteng (untuk penempatan visualisasi SNA)
KALTENG_COORDINATES: Dict[str, Tuple[float, float]] = {
    "Kota Palangka Raya": (113.9213, -2.2161),
    "Kabupaten Pulang Pisau": (114.2500, -2.7500),
    "Kabupaten Kapuas": (114.3833, -3.0000),
    "Kabupaten Katingan": (113.4000, -1.9000),
    "Kabupaten Gunung Mas": (113.8500, -1.1500),
    "Kabupaten Kotawaringin Timur": (112.9500, -2.5333),
    "Kabupaten Kotawaringin Barat": (111.6333, -2.6833),
    "Kabupaten Seruyan": (112.4500, -2.8500),
    "Kabupaten Lamandau": (111.2833, -1.8833),
    "Kabupaten Sukamara": (111.2333, -2.9667),
    "Kabupaten Barito Selatan": (114.8333, -1.7500),
    "Kabupaten Barito Timur": (115.1333, -1.9167),
    "Kabupaten Barito Utara": (115.0000, -0.9500),
    "Kabupaten Murung Raya": (114.5833, -0.0167),
}

# Matriks interkoneksi logistik, jalan Trans-Kalimantan, dan DAS antarwilayah
KALTENG_TOPOLOGY_EDGES: List[Tuple[str, str, int, str]] = [
    ("Kota Palangka Raya", "Kabupaten Pulang Pisau", 95, "Trans Kalimantan Selatan"),
    ("Kota Palangka Raya", "Kabupaten Katingan", 88, "Poros Tengah Barat"),
    ("Kota Palangka Raya", "Kabupaten Gunung Mas", 82, "Akses Utama Pedalaman"),
    ("Kota Palangka Raya", "Kabupaten Kapuas", 78, "Koridor Ekonomi Ibukota"),
    ("Kabupaten Pulang Pisau", "Kabupaten Kapuas", 90, "Lumbung Pangan & Pelabuhan"),
    ("Kabupaten Katingan", "Kabupaten Kotawaringin Timur", 85, "Arteri Logistik Utama"),
    ("Kabupaten Kotawaringin Timur", "Kabupaten Seruyan", 80, "Sentra Sawit & Industri"),
    ("Kabupaten Kotawaringin Timur", "Kabupaten Kotawaringin Barat", 84, "Koneksi Dua Kota Utama"),
    ("Kabupaten Kotawaringin Barat", "Kabupaten Lamandau", 79, "Koridor Perbatasan Kalbar"),
    ("Kabupaten Kotawaringin Barat", "Kabupaten Sukamara", 75, "Pesisir Barat Kalteng"),
    ("Kabupaten Lamandau", "Kabupaten Sukamara", 65, "Konektivitas Barat"),
    ("Kabupaten Kapuas", "Kabupaten Barito Selatan", 76, "Pintu Masuk DAS Barito"),
    ("Kabupaten Barito Selatan", "Kabupaten Barito Timur", 88, "Konektivitas Barito Hilir"),
    ("Kabupaten Barito Selatan", "Kabupaten Barito Utara", 82, "Poros Utama Batubara/Sungai"),
    ("Kabupaten Barito Utara", "Kabupaten Murung Raya", 86, "Koridor Hulu Barito"),
    ("Kabupaten Gunung Mas", "Kabupaten Barito Utara", 55, "Jalur Penghubung Lintas Timur"),
    ("Kabupaten Gunung Mas", "Kabupaten Katingan", 60, "Batas Wilayah Hulu"),
    ("Kabupaten Seruyan", "Kabupaten Kotawaringin Barat", 70, "Penyangga Taman Nasional Tanjung Puting"),
]


# ==============================================================================
# 3. FUNGSI PREPROCESSING, DATA CLEANING & FUZZY STANDARDIZATION
# ==============================================================================
def standardize_region_name(raw_name: str) -> str:
    """
    Menstandarkan nama wilayah yang diinputkan pengguna atau dari dataset
    menjadi 1 dari 14 nama resmi Kabupaten/Kota di Kalimantan Tengah.
    Jika tidak cocok, mengembalikan string kosong ("") agar dapat difilter.
    """
    if pd.isna(raw_name) or not str(raw_name).strip():
        return ""
    
    cleaned = str(raw_name).lower().strip()
    # Hapus prefiks umum seperti 'kab.', 'kabupaten', 'kota'
    cleaned_simplified = re.sub(r"^(kabupaten|kab\.|kota)\s+", "", cleaned).strip()
    
    # Pencocokan persis pada kamus sinonim
    if cleaned in REGION_SYNONYMS:
        return REGION_SYNONYMS[cleaned]
    if cleaned_simplified in REGION_SYNONYMS:
        return REGION_SYNONYMS[cleaned_simplified]
    
    # Fuzzy substring search pada daftar resmi Kalteng
    for official in KALTENG_REGIONS:
        official_clean = official.lower().replace("kabupaten ", "").replace("kota ", "")
        if official_clean in cleaned or cleaned in official_clean:
            return official
            
    return ""


@st.cache_data(show_spinner=False)
def generate_sample_kalteng_dataset(n_samples: int = 400) -> pd.DataFrame:
    """
    Membuat dataset sintetis aspirasi pembangunan Kalteng yang realistis
    terdistribusi di seluruh 13 Kabupaten & 1 Kota Kalimantan Tengah.
    """
    np.random.seed(42)
    categories = ["Transportasi", "Ruang Terbuka Hijau", "Sampah", "Lainnya"]
    sentiments = ["Positif", "Negatif", "Netral"]
    
    komentar_templates = {
        "Transportasi": [
            "Jalan lintas penghubung antar {w1} dan {w2} kondisinya berlubang dan butuh perbaikan aspal segera.",
            "Apresiasi pembukaan trayek bus perintis rute {w1} menuju {w2}, sangat mempermudah mobilitas masyarakat.",
            "Waktu tempuh angkutan logistik dari {w1} ke {w2} terhambat karena jembatan kayu yang mulai rapuh.",
            "Mohon penerangan jalan umum diperbanyak di poros utama {w1}.",
            "Peningkatan armada transportasi air di sepanjang aliran sungai sangat membantu warga pesisir.",
        ],
        "Ruang Terbuka Hijau": [
            "Taman kota dan ruang publik di pusat {w1} sekarang makin asri dan ramah anak.",
            "Perluasan area hutan kota dan taman edukasi di {w1} perlu dijaga kelestariannya dari kebakaran lahan.",
            "Kondisi pepohonan peneduh jalan protokol di {w1} butuh pemangkasan rutin jelang musim hujan.",
            "Pembangunan waterfront park di pinggiran sungai {w1} memberikan dampak positif bagi UMKM lokal.",
        ],
        "Sampah": [
            "Tempat Pembuangan Sementara (TPS) di pasar {w1} sering meluap dan mencemari drainase sekitar.",
            "Program bank sampah mandiri di kelurahan {w1} berhasil menurunkan timbunan sampah plastik.",
            "Kurangnya armada truk pengangkut sampah di {w1} menyebabkan tumpukan sampah liar di tepi jalan.",
            "Perlu edukasi pengelolaan sampah terpadu agar warga tidak membuang sampah ke daerah aliran sungai.",
        ],
        "Lainnya": [
            "Pelayanan publik di kantor perizinan {w1} semakin cepat dan transparan berkat sistem online.",
            "Jaringan telekomunikasi dan sinyal 4G di daerah pedalaman {w1} masih sering hilang.",
            "Program stabilisasi harga sembako dan pasar murah di {w1} sangat membantu daya beli warga.",
        ],
    }

    records = []
    for i in range(n_samples):
        # Distribusi wilayah realistis dengan bobot lebih tinggi pada hub ekonomi
        weights = [
            0.18, 0.06, 0.05, 0.07, 0.06, 0.08, 0.07,
            0.11, 0.14, 0.04, 0.05, 0.05, 0.02, 0.02
        ]
        w1 = np.random.choice(KALTENG_REGIONS, p=weights)
        # Pilih wilayah relasi tetangga untuk mensimulasikan edge interaksi
        possible_targets = [w for w in KALTENG_REGIONS if w != w1]
        w2 = np.random.choice(possible_targets)
        
        cat = np.random.choice(categories, p=[0.45, 0.20, 0.25, 0.10])
        template = np.random.choice(komentar_templates[cat])
        text = template.format(w1=w1.replace("Kabupaten ", "").replace("Kota ", ""),
                               w2=w2.replace("Kabupaten ", "").replace("Kota ", ""))
        
        # Sentimen berbobot realistis (transportasi & sampah cenderung lebih kritis)
        if cat in ["Transportasi", "Sampah"]:
            sent = np.random.choice(sentiments, p=[0.25, 0.55, 0.20])
        else:
            sent = np.random.choice(sentiments, p=[0.50, 0.25, 0.25])
            
        date = pd.date_range("2026-01-01", "2026-09-20", periods=n_samples)[i]
        
        records.append({
            "id": f"KALTENG-{i+1:04d}",
            "tanggal": date.strftime("%Y-%m-%d"),
            "wilayah": w1,
            "wilayah_terkoneksi": w2,
            "kategori": cat,
            "sentimen": sent,
            "komentar": text,
        })
        
    return pd.DataFrame(records)


def clean_and_validate_dataset(df_input: pd.DataFrame) -> Tuple[pd.DataFrame, int, int]:
    """
    Membersihkan missing value dan memvalidasi bahwa hanya data yang berasal dari
    13 Kabupaten & 1 Kota di Kalimantan Tengah yang diproses.
    Mengembalikan (df_clean, total_raw_rows, dropped_rows_count).
    """
    total_raw = len(df_input)
    df = df_input.copy()
    
    # 1. Standarisasi nama kolom ke huruf kecil
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    # 2. Deteksi kolom komentar dan wilayah
    col_komentar = next((c for c in df.columns if any(k in c for k in ["komentar", "comment", "teks", "text", "aspirasi"])), None)
    col_wilayah = next((c for c in df.columns if any(k in c for k in ["wilayah", "region", "kabupaten", "kota", "lokasi"])), None)
    col_koneksi = next((c for c in df.columns if any(k in c for k in ["terkoneksi", "tujuan", "partner", "relasi"])), None)
    
    if not col_komentar or not col_wilayah:
        raise ValueError("Dataset harus memiliki minimal 2 kolom: 'komentar' dan 'wilayah'!")
        
    # 3. Penanganan Missing Values pada baris kunci
    df = df.dropna(subset=[col_komentar, col_wilayah])
    df = df[df[col_komentar].astype(str).str.strip() != ""]
    df = df[df[col_wilayah].astype(str).str.strip() != ""]
    
    # 4. Standardisasi Nama Wilayah HANYA untuk Kalimantan Tengah
    df["wilayah_resmi"] = df[col_wilayah].apply(standardize_region_name)
    
    if col_koneksi and col_koneksi in df.columns:
        df["wilayah_koneksi_resmi"] = df[col_koneksi].apply(standardize_region_name)
    else:
        df["wilayah_koneksi_resmi"] = ""
        
    # 5. Filter ketat: HANYA wilayah resmi Kalimantan Tengah yang lolos
    df_clean = df[df["wilayah_resmi"] != ""].copy()
    
    # Standarisasi kolom kategori dan sentimen jika ada
    if "kategori" not in df_clean.columns:
        df_clean["kategori"] = "Lainnya"
    if "sentimen" not in df_clean.columns:
        df_clean["sentimen"] = "Netral"
        
    df_clean["komentar"] = df_clean[col_komentar].astype(str)
    df_clean["wilayah"] = df_clean["wilayah_resmi"]
    
    dropped_count = total_raw - len(df_clean)
    return df_clean, total_raw, dropped_count


# ==============================================================================
# 4. SOCIAL NETWORK ANALYSIS (SNA) ENGINE DENGAN NETWORKX
# ==============================================================================
def build_kalteng_sna_graph(df_filtered: pd.DataFrame, min_edge_weight: int = 1) -> Tuple[nx.Graph, Dict[str, float], Dict[str, float]]:
    """
    Membangun graf jaringan antarwilayah Kalimantan Tengah.
    - Nodes: Kabupaten / Kota di Kalteng
    - Edges: Interaksi logistik, arus isu, atau kedekatan spasial
    - Menghitung Degree Centrality & Betweenness Centrality
    """
    G = nx.Graph()
    
    # 1. Tambahkan seluruh 14 wilayah sebagai node dasar
    for node in KALTENG_REGIONS:
        coords = KALTENG_COORDINATES.get(node, (113.0, -1.5))
        G.add_node(node, lon=coords[0], lat=coords[1])
        
    # 2. Inisialisasi bobot edge dari topologi logistik Kalteng
    edge_weights: Dict[Tuple[str, str], int] = {}
    for u, v, weight, route in KALTENG_TOPOLOGY_EDGES:
        edge_weights[tuple(sorted([u, v]))] = weight
        
    # 3. Tingkatkan bobot edge berdasarkan dinamika dataset yang terfilter
    if "wilayah_koneksi_resmi" in df_filtered.columns:
        pair_counts = df_filtered[df_filtered["wilayah_koneksi_resmi"] != ""]
        for _, row in pair_counts.iterrows():
            w1 = row["wilayah"]
            w2 = row["wilayah_koneksi_resmi"]
            if w1 and w2 and w1 != w2:
                pair = tuple(sorted([w1, w2]))
                edge_weights[pair] = edge_weights.get(pair, 0) + 10

    # 4. Masukkan edge ke graf NetworkX
    for (u, v), w in edge_weights.items():
        if w >= min_edge_weight:
            G.add_edge(u, v, weight=w)
            
    # 5. Kalkulasi SNA Centrality Metrics
    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G, weight="weight")
    
    # Pasang metrik ke atribut node
    for node in G.nodes():
        G.nodes[node]["degree_centrality"] = degree_centrality.get(node, 0.0)
        G.nodes[node]["betweenness_centrality"] = betweenness_centrality.get(node, 0.0)
        # Hitung jumlah komentar pada wilayah ini dalam data terfilter
        comments_count = len(df_filtered[df_filtered["wilayah"] == node])
        G.nodes[node]["comments_count"] = comments_count
        
    return G, degree_centrality, betweenness_centrality


def create_plotly_sna_figure(G: nx.Graph, selected_regions: List[str]) -> go.Figure:
    """
    Membuat visualisasi grafik jaringan (SNA) interaktif berbasis Plotly.
    Mendukung interaksi zoom, pan, hover tooltip, dan highlight node terpilih.
    """
    # 1. Ekstraksi koordinat edge
    edge_x = []
    edge_y = []
    edge_hover_texts = []
    
    for u, v, data in G.edges(data=True):
        x0, y0 = G.nodes[u]["lon"], G.nodes[u]["lat"]
        x1, y1 = G.nodes[v]["lon"], G.nodes[v]["lat"]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])

    # Trace untuk garis penghubung (Edges)
    edge_trace = go.Scatter(
        x=edge_x,
        y=edge_y,
        line=dict(width=1.5, color="rgba(79, 156, 249, 0.4)"),
        hoverinfo="none",
        mode="lines",
    )

    # 2. Ekstraksi atribut node
    node_x = []
    node_y = []
    node_text = []
    node_size = []
    node_color = []
    
    for node in G.nodes():
        x, y = G.nodes[node]["lon"], G.nodes[node]["lat"]
        node_x.append(x)
        node_y.append(y)
        
        deg = G.nodes[node]["degree_centrality"]
        bet = G.nodes[node]["betweenness_centrality"]
        cnt = G.nodes[node]["comments_count"]
        is_selected = node in selected_regions
        
        # Tooltip komprehensif saat hover
        short_name = node.replace("Kabupaten ", "").replace("Kota ", "")
        hover_info = (
            f"<b>{node}</b><br>"
            f"━━━━━━━━━━━━━━━━━━━━━━<br>"
            f"📍 Status Filter: {'Aktif / Terpilih' if is_selected else 'Tidak Terpilih'}<br>"
            f"💬 Total Aspirasi Terkait: <b>{cnt:,}</b> komentar<br>"
            f"🔗 Degree Centrality: <b>{deg:.4f}</b><br>"
            f"🌉 Betweenness Centrality: <b>{bet:.4f}</b><br>"
            f"📌 Derajat Koneksi (Neighbors): {G.degree(node)} link"
        )
        node_text.append(hover_info)
        
        # Ukuran node proporsional dengan Betweenness & Degree
        base_size = 14 + (bet * 35) + (deg * 15)
        node_size.append(base_size if is_selected else max(base_size * 0.7, 10))
        
        # Pewarnaan: Node terpilih menyala (#4F9CF9), ibukota (#34D399), non-terpilih redup (#4B5563)
        if node == "Kota Palangka Raya":
            node_color.append("#34D399")  # Hijau Emerald untuk Ibukota
        elif is_selected:
            node_color.append("#4F9CF9")  # Biru Primer
        else:
            node_color.append("#4B5563")  # Abu-abu redup jika di luar filter

    # Trace untuk titik wilayah (Nodes)
    node_trace = go.Scatter(
        x=node_x,
        y=node_y,
        mode="markers+text",
        hoverinfo="text",
        text=[n.replace("Kabupaten ", "Kab. ").replace("Kota ", "") for n in G.nodes()],
        textposition="top center",
        textfont=dict(family="Inter", size=10, color="#E5E7EB"),
        hovertext=node_text,
        marker=dict(
            showscale=False,
            color=node_color,
            size=node_size,
            line=dict(width=2, color="#FFFFFF"),
        ),
    )

    # 3. Canvas Layout dengan estetika dark theme
    fig = go.Figure(
        data=[edge_trace, node_trace],
        layout=go.Layout(
            title=dict(
                text="<b>Topologi Jaringan & Sentralitas Wilayah Kalteng (SNA)</b>",
                font=dict(size=14, color="#E5E7EB"),
                x=0.02,
                y=0.96,
            ),
            showlegend=False,
            hovermode="closest",
            margin=dict(b=20, l=20, r=20, t=50),
            plot_bgcolor="#141519",
            paper_bgcolor="#1A1B1F",
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            height=460,
        ),
    )
    return fig


# ==============================================================================
# 5. INTERFACE UTAMA DASHBOARD STREAMLIT
# ==============================================================================
def main():
    # --- HEADER UTAMA ---
    st.markdown('<span class="kalteng-badge">PROVINSI KALIMANTAN TENGAH</span>', unsafe_allow_html=True)
    st.title("CivicAI : Analisis Aspirasi & Social Network Analysis (SNA)")
    st.caption("Dashboard Intelijen Kebijakan Publik untuk 13 Kabupaten & 1 Kota Kalimantan Tengah")
    st.markdown("---")

    # --- SIDEBAR CONTROL PANEL ---
    with st.sidebar:
        st.header("⚙️ Konfigurasi Data")
        
        # Pilihan Sumber Data
        data_source = st.radio(
            "Pilih Sumber Dataset:",
            ["Dataset Sintetis Kalimantan Tengah (Terverifikasi)", "Unggah File CSV Mandiri"],
            index=0,
        )
        
        raw_df = None
        if data_source == "Unggah File CSV Mandiri":
            uploaded_file = st.file_uploader(
                "Upload file CSV (Wajib kolom: 'komentar', 'wilayah'):",
                type=["csv"],
                help="Data di luar 13 Kabupaten & 1 Kota Kalteng akan difilter secara otomatis.",
            )
            if uploaded_file is not None:
                try:
                    raw_df = pd.read_csv(uploaded_file)
                    st.success(f"File berhasil diunggah: {len(raw_df):,} baris data.")
                except Exception as e:
                    st.error(f"Gagal membaca CSV: {e}")
            else:
                st.info("Menampilkan data sampel Kalteng sementara file belum diunggah.")
                raw_df = generate_sample_kalteng_dataset()
        else:
            raw_df = generate_sample_kalteng_dataset()

        # Data Cleaning & Validation Step
        try:
            df_kalteng, total_raw_count, dropped_count = clean_and_validate_dataset(raw_df)
            if dropped_count > 0:
                st.warning(f"⚠️ {dropped_count} baris di luar wilayah Kalteng / missing values telah dieliminasi.")
        except Exception as err:
            st.error(f"Validasi data gagal: {err}")
            return

        st.markdown("---")
        st.header("📍 Filter Wilayah (Kalteng Only)")

        # Presets Koridor Wilayah
        koridor_choice = st.selectbox(
            "Filter Cepat per Koridor Wilayah:",
            ["-- Kustomisasi Bebas --"] + list(KORIDOR_MAP.keys()),
            index=0,
        )

        # Default pilihan wilayah
        if koridor_choice != "-- Kustomisasi Bebas --":
            default_selected = KORIDOR_MAP[koridor_choice]
        else:
            default_selected = KALTENG_REGIONS

        col_btn1, col_btn2 = st.columns(2)
        pilih_semua = col_btn1.button("Pilih Semua (14)")
        reset_pilihan = col_btn2.button("Reset (Palangka Raya)")

        if pilih_semua:
            default_selected = KALTENG_REGIONS
        elif reset_pilihan:
            default_selected = ["Kota Palangka Raya"]

        # Komponen Multi-Select Wilayah (DIRESTRIKSI KETAT HANYA KALTENG)
        selected_regions = st.multiselect(
            "Pilih Kabupaten / Kota Terpantau:",
            options=KALTENG_REGIONS,
            default=default_selected,
            help="Hanya mencakup 13 Kabupaten dan 1 Kota resmi di Kalimantan Tengah",
        )

        st.markdown("---")
        st.header("🔍 Filter Parameter Analitik")
        
        # Filter Kategori Isu
        all_categories = sorted(df_kalteng["kategori"].dropna().unique().tolist())
        selected_categories = st.multiselect(
            "Kategori Pembangunan:",
            options=all_categories,
            default=all_categories,
        )

        # Filter Sentimen
        all_sentiments = ["Positif", "Netral", "Negatif"]
        selected_sentiments = st.multiselect(
            "Sentimen Publik:",
            options=all_sentiments,
            default=all_sentiments,
        )

        # Threshold interaksi SNA
        min_sna_weight = st.slider("Ambang Batas Bobot Interaksi SNA:", 1, 50, 10)

    # --- VALIDASI FILTER WILAYAH ---
    if not selected_regions:
        st.warning("⚠️ Silakan pilih minimal 1 Kabupaten/Kota di Kalimantan Tengah pada panel filter sebelah kiri.")
        return

    # --- FILTERING DATA REAKTIF ---
    # Logika filter interaktif yang langsung memengaruhi seluruh chart, metrics, dan SNA
    mask = (
        (df_kalteng["wilayah"].isin(selected_regions)) &
        (df_kalteng["kategori"].isin(selected_categories)) &
        (df_kalteng["sentimen"].isin(selected_sentiments))
    )
    df_filtered = df_kalteng[mask].copy()

    # --- BARIS METRIK UTAMA (KPI) ---
    st.subheader("📊 Ringkasan Eksekutif Wilayah Terpilih")
    kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)

    total_comments = len(df_filtered)
    positive_pct = (
        (len(df_filtered[df_filtered["sentimen"] == "Positif"]) / total_comments * 100)
        if total_comments > 0 else 0
    )
    top_cat = (
        df_filtered["kategori"].mode().iloc[0]
        if not df_filtered.empty else "N/A"
    )
    top_region = (
        df_filtered["wilayah"].mode().iloc[0]
        if not df_filtered.empty else "N/A"
    )

    kpi_col1.metric("Total Aspirasi", f"{total_comments:,} Data", f"{len(selected_regions)}/14 Wilayah")
    kpi_col2.metric("Indeks Sentimen Positif", f"{positive_pct:.1f}%", "Kepuasan Publik")
    kpi_col3.metric("Isu Paling Dominan", top_cat, "Prioritas Kebijakan")
    kpi_col4.metric("Wilayah Teraktif", top_region.replace("Kabupaten ", "Kab. ").replace("Kota ", ""), "Volume Aspirasi Tertinggi")

    st.markdown("---")

    # --- MODUL SOCIAL NETWORK ANALYSIS (SNA) ---
    st.subheader("🌐 Social Network Analysis (SNA) Wilayah Kalimantan Tengah")
    st.caption("Memetakan konektivitas logistik, interkoneksi transportasi, dan simpul lalu lintas isu strategis antar-kabupaten/kota.")

    # Eksekusi komputasi SNA dengan NetworkX
    G, deg_centrality, bet_centrality = build_kalteng_sna_graph(df_filtered, min_edge_weight=min_sna_weight)

    sna_col1, sna_col2 = st.columns([1.8, 1.2])

    with sna_col1:
        # Visualisasi Graf Interaktif Plotly
        fig_sna = create_plotly_sna_figure(G, selected_regions)
        st.plotly_chart(fig_sna, use_container_width=True)

    with sna_col2:
        # Metrik & Wawasan Sentralitas (Leaderboard Hub Kalteng)
        st.markdown("**Leaderboard Simpul Sentralitas (SNA Metrics):**")
        
        sna_records = []
        for reg in selected_regions:
            short_n = reg.replace("Kabupaten ", "Kab. ").replace("Kota ", "")
            sna_records.append({
                "Wilayah": short_n,
                "Degree Centrality": round(deg_centrality.get(reg, 0.0), 4),
                "Betweenness Centrality": round(bet_centrality.get(reg, 0.0), 4),
                "Komentar": len(df_filtered[df_filtered["wilayah"] == reg]),
            })
            
        df_sna_table = pd.DataFrame(sna_records).sort_values(by="Betweenness Centrality", ascending=False)
        st.dataframe(
            df_sna_table,
            use_container_width=True,
            hide_index=True,
            height=280,
        )
        
        st.info(
            "💡 **Wawasan Analitis:**\n"
            "- **Degree Centrality** tinggi merepresentasikan wilayah dengan pintu akses dan konektivitas koridor terbanyak.\n"
            "- **Betweenness Centrality** tinggi merepresentasikan wilayah 'jembatan logistik' kritis (seperti Palangka Raya dan Sampit) yang jika terganggu akan memutus alur rantai pasok provinsi."
        )

    st.markdown("---")

    # --- MODUL SEBARAN KATEGORI & SENTIMEN ---
    st.subheader("📈 Distribusi Sentimen & Isu Tematik")
    chart_col1, chart_col2 = st.columns(2)

    with chart_col1:
        if not df_filtered.empty:
            # Bar chart sentimen per kabupaten/kota terpilih
            sent_pivot = pd.crosstab(df_filtered["wilayah"], df_filtered["sentimen"]).reset_index()
            # Pemendekan nama untuk tampilan chart yang rapi
            sent_pivot["wilayah_label"] = sent_pivot["wilayah"].str.replace("Kabupaten ", "Kab. ").str.replace("Kota ", "")
            
            fig_bar = px.bar(
                sent_pivot,
                x="wilayah_label",
                y=[col for col in ["Positif", "Netral", "Negatif"] if col in sent_pivot.columns],
                title="Distribusi Sentimen Publik per Wilayah Terpilih",
                labels={"value": "Jumlah Komentar", "wilayah_label": "Kabupaten / Kota"},
                color_discrete_map={"Positif": "#34D399", "Netral": "#FBBF24", "Negatif": "#F87171"},
                barmode="stack",
            )
            fig_bar.update_layout(
                plot_bgcolor="#141519",
                paper_bgcolor="#1A1B1F",
                font=dict(color="#E5E7EB"),
                margin=dict(t=40, b=20, l=20, r=20),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )
            st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("Tidak ada data untuk kombinasi filter ini.")

    with chart_col2:
        if not df_filtered.empty:
            # Donut chart proporsi kategori isu
            cat_counts = df_filtered["kategori"].value_counts().reset_index()
            cat_counts.columns = ["Kategori", "Jumlah"]
            
            fig_pie = px.pie(
                cat_counts,
                names="Kategori",
                values="Jumlah",
                hole=0.45,
                title="Proporsi Isu Pembangunan di Wilayah Terpilih",
                color="Kategori",
                color_discrete_map={
                    "Transportasi": "#4F9CF9",
                    "Ruang Terbuka Hijau": "#34D399",
                    "Sampah": "#FBBF24",
                    "Lainnya": "#9CA3AF",
                },
            )
            fig_pie.update_layout(
                plot_bgcolor="#141519",
                paper_bgcolor="#1A1B1F",
                font=dict(color="#E5E7EB"),
                margin=dict(t=40, b=20, l=20, r=20),
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        else:
            st.info("Tidak ada data untuk kombinasi filter ini.")

    # --- TABEL RINCIAN ASPIRASI MASYARAKAT ---
    st.subheader("📑 Log Aspirasi Warga Kalteng (Data Terfilter)")
    
    col_search, col_export = st.columns([3, 1])
    search_query = col_search.text_input("Cari kata kunci dalam komentar:", placeholder="Ketik kata kunci...")
    
    df_display = df_filtered.copy()
    if search_query:
        df_display = df_display[df_display["komentar"].str.contains(search_query, case=False, na=False)]

    with col_export:
        csv_data = df_display.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download Data Filtered (CSV)",
            data=csv_data,
            file_name="aspirasi_kalteng_filtered.csv",
            mime="text/csv",
        )

    st.dataframe(
        df_display[["id", "tanggal", "wilayah", "kategori", "sentimen", "komentar"]],
        use_container_width=True,
        hide_index=True,
        height=320,
    )


if __name__ == "__main__":
    main()
