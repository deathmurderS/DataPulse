"""
DataPulse Streamlit Dashboard
Interactive dashboard for job vacancy data analysis.
Features 8 charts, filters, search, and CSV/Excel export.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, date
from typing import Optional
import httpx
import json
import io

# Page configuration
st.set_page_config(
    page_title="DataPulse - Job Analytics Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Constants
API_BASE_URL = "http://api:8000"  # Docker internal network


# ===== Helper Functions =====

@st.cache_data(ttl=300)
def fetch_data(endpoint: str) -> Optional[dict]:
    """Fetch data from API with caching."""
    try:
        response = httpx.get(f"{API_BASE_URL}{endpoint}", timeout=10)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        st.error(f"API connection error: {e}")
        return None


@st.cache_data(ttl=300)
def fetch_jobs(skip: int = 0, limit: int = 1000) -> pd.DataFrame:
    """Fetch jobs data and return as DataFrame."""
    data = fetch_data(f"/api/jobs?skip={skip}&limit={limit}")
    if data and "data" in data:
        return pd.DataFrame(data["data"])
    return pd.DataFrame()


@st.cache_data(ttl=300)
def fetch_stats() -> Optional[dict]:
    """Fetch job statistics."""
    return fetch_data("/api/jobs/stats")


@st.cache_data(ttl=300)
def fetch_categories() -> list:
    """Fetch available categories."""
    data = fetch_data("/api/jobs/categories")
    if data and "categories" in data:
        return data["categories"]
    return []


@st.cache_data(ttl=300)
def fetch_companies() -> list:
    """Fetch available companies."""
    data = fetch_data("/api/jobs/companies")
    if data and "companies" in data:
        return data["companies"]
    return []


def export_to_csv(df: pd.DataFrame) -> bytes:
    """Convert DataFrame to CSV bytes."""
    output = io.BytesIO()
    df.to_csv(output, index=False)
    return output.getvalue()


def export_to_excel(df: pd.DataFrame) -> bytes:
    """Convert DataFrame to Excel bytes."""
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="DataPulse Jobs")
    return output.getvalue()


# ===== Sidebar =====

st.sidebar.title("🔍 DataPulse")
st.sidebar.markdown("---")
st.sidebar.markdown(
    """
    **Dashboard Demo**
    
    Data contoh lowongan kerja untuk keperluan demonstrasi.
    Bukan data real-time atau data lengkap.
    """
)

# Disclaimer
st.sidebar.warning(
    "⚠️ **Disclaimer**\n\n"
    "Data ini adalah sample untuk keperluan demo/portofolio. "
    "Tidak merepresentasikan lowongan kerja yang sebenarnya."
)

st.sidebar.markdown("---")
st.sidebar.markdown("### **Filter Data**")

# Search box
search_query = st.sidebar.text_input("🔎 Cari judul, perusahaan, deskripsi", "")

# Filters
col1, col2 = st.sidebar.columns(2)
with col1:
    selected_category = st.selectbox(
        "Kategori",
        ["Semua"] + fetch_categories(),
    )
with col2:
    companies = fetch_companies()
    selected_company = st.selectbox(
        "Perusahaan",
        ["Semua"] + companies,
    )

# Employment type filter
employment_types = ["Semua", "Full-time", "Part-time", "Contract", "Internship", "Freelance"]
selected_employment = st.sidebar.selectbox("Tipe Pekerjaan", employment_types)

# Location filter
locations = fetch_data("/api/jobs/stats")
location_options = ["Semua"]
if locations and "by_location" in locations:
    location_options += [loc["location"] for loc in locations["by_location"]]
selected_location = st.sidebar.selectbox("Lokasi", location_options)

# Salary range
st.sidebar.markdown("### **Rentang Gaji**")
salary_min = st.sidebar.number_input("Gaji Min (IDR)", min_value=0, value=0, step=1000000, format="%d")
salary_max = st.sidebar.number_input("Gaji Max (IDR)", min_value=0, value=50000000, step=1000000, format="%d")

# Date filter
st.sidebar.markdown("### **Tanggal Posting**")
date_from = st.sidebar.date_input("Dari", date(2026, 6, 1))
date_to = st.sidebar.date_input("Sampai", date.today())

st.sidebar.markdown("---")
st.sidebar.markdown(
    """
    **Tech Stack:**
    - Python • FastAPI • Streamlit
    - PostgreSQL • Docker
    - Pandas • Plotly
    
    [Dokumentasi API](/docs)
    """
)

# ===== Main Dashboard =====

# Header
st.title("📊 DataPulse - Job Analytics Dashboard")
st.markdown("Dashboard analisis lowongan pekerjaan dari berbagai sumber.")

# Fetch data
stats = fetch_stats()
df = fetch_jobs()

if df.empty:
    st.warning("📭 Belum ada data. Jalankan scheduler untuk mengisi database.")
    st.info("""
    **Cara menjalankan pipeline:**
    1. Pastikan semua container berjalan: `docker-compose up -d`
    2. Scheduler akan otomatis menjalankan scraping & ETL
    3. Refresh halaman ini setelah beberapa saat
    """)
    st.stop()

# ===== KPI Cards Row =====
st.markdown("### **📈 Key Metrics**")
kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)

with kpi_col1:
    st.metric(
        label="Total Lowongan",
        value=len(df),
        delta=None,
    )

with kpi_col2:
    companies_count = df["company"].nunique() if "company" in df.columns else 0
    st.metric(
        label="Perusahaan",
        value=companies_count,
    )

with kpi_col3:
    locations_count = df["location"].nunique() if "location" in df.columns else 0
    st.metric(
        label="Lokasi",
        value=locations_count,
    )

with kpi_col4:
    categories_count = df["category"].nunique() if "category" in df.columns else 0
    st.metric(
        label="Kategori",
        value=categories_count,
    )

st.markdown("---")

# ===== Filters Applied Section =====
if any([search_query, selected_category != "Semua", selected_company != "Semua",
        selected_employment != "Semua", selected_location != "Semua",
        salary_min > 0, salary_max < 50000000]):
    st.markdown("### **🔎 Filter Aktif**")
    filter_tags = []
    if search_query:
        filter_tags.append(f"Pencarian: '{search_query}'")
    if selected_category != "Semua":
        filter_tags.append(f"Kategori: {selected_category}")
    if selected_company != "Semua":
        filter_tags.append(f"Perusahaan: {selected_company}")
    if selected_employment != "Semua":
        filter_tags.append(f"Tipe: {selected_employment}")
    if selected_location != "Semua":
        filter_tags.append(f"Lokasi: {selected_location}")
    if salary_min > 0:
        filter_tags.append(f"Gaji ≥ Rp{salary_min:,.0f}")
    if salary_max < 50000000:
        filter_tags.append(f"Gaji ≤ Rp{salary_max:,.0f}")

    for tag in filter_tags:
        st.info(f"📌 {tag}")

    # Apply filters to dataframe
    filtered_df = df.copy()
    if search_query:
        mask = (
            filtered_df["title"].str.contains(search_query, case=False, na=False) |
            filtered_df["company"].str.contains(search_query, case=False, na=False) |
            filtered_df["description"].str.contains(search_query, case=False, na=False)
        )
        filtered_df = filtered_df[mask]
    if selected_category != "Semua":
        filtered_df = filtered_df[filtered_df["category"] == selected_category]
    if selected_company != "Semua":
        filtered_df = filtered_df[filtered_df["company"] == selected_company]
    if selected_employment != "Semua":
        filtered_df = filtered_df[filtered_df["employment_type"] == selected_employment]
    if selected_location != "Semua":
        filtered_df = filtered_df[filtered_df["location"] == selected_location]
    if salary_min > 0:
        filtered_df = filtered_df[filtered_df["salary_max"] >= salary_min]
    if salary_max < 50000000:
        filtered_df = filtered_df[filtered_df["salary_min"] <= salary_max]

    st.markdown(f"Menampilkan **{len(filtered_df)}** dari **{len(df)}** lowongan")
else:
    filtered_df = df

st.markdown("---")

# ===== Chart 1: Jobs by Category (Bar Chart) =====
st.markdown("### **1️⃣ Lowongan per Kategori**")
if stats and "by_category" in stats:
    cat_df = pd.DataFrame(stats["by_category"])
    if not cat_df.empty:
        fig = px.bar(
            cat_df,
            x="category",
            y="count",
            title="Jumlah Lowongan per Kategori",
            labels={"category": "Kategori", "count": "Jumlah"},
            color="count",
            color_continuous_scale="Viridis",
            text="count",
        )
        fig.update_traces(textposition="outside")
        fig.update_layout(showlegend=False, height=400)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Belum ada data kategori")
else:
    st.info("Data tidak tersedia")

# ===== Row with 2 charts side by side =====
col_chart2, col_chart3 = st.columns(2)

# ===== Chart 2: Jobs by Company (Top 10) =====
with col_chart2:
    st.markdown("### **2️⃣ Top 10 Perusahaan**")
    if stats and "by_company" in stats:
        comp_df = pd.DataFrame(stats["by_company"])
        if not comp_df.empty:
            fig = px.bar(
                comp_df,
                x="count",
                y="company",
                title="Perusahaan dengan Lowongan Terbanyak",
                labels={"company": "Perusahaan", "count": "Jumlah"},
                color="count",
                color_continuous_scale="Blues",
                text="count",
                orientation="h",
            )
            fig.update_traces(textposition="outside")
            fig.update_layout(showlegend=False, height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Belum ada data perusahaan")

# ===== Chart 3: Jobs by Location (Top 10) =====
with col_chart3:
    st.markdown("### **3️⃣ Top 10 Lokasi**")
    if stats and "by_location" in stats:
        loc_df = pd.DataFrame(stats["by_location"])
        if not loc_df.empty:
            fig = px.bar(
                loc_df,
                x="count",
                y="location",
                title="Lokasi dengan Lowongan Terbanyak",
                labels={"location": "Lokasi", "count": "Jumlah"},
                color="count",
                color_continuous_scale="Reds",
                text="count",
                orientation="h",
            )
            fig.update_traces(textposition="outside")
            fig.update_layout(showlegend=False, height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Belum ada data lokasi")

# ===== Row with 2 charts side by side =====
col_chart4, col_chart5 = st.columns(2)

# ===== Chart 4: Employment Type Distribution (Pie) =====
with col_chart4:
    st.markdown("### **4️⃣ Tipe Pekerjaan**")
    if stats and "by_employment_type" in stats:
        emp_df = pd.DataFrame(stats["by_employment_type"])
        if not emp_df.empty:
            fig = px.pie(
                emp_df,
                values="count",
                names="type",
                title="Distribusi Tipe Pekerjaan",
                color_discrete_sequence=px.colors.qualitative.Set3,
                hole=0.4,
            )
            fig.update_traces(textposition="inside", textinfo="percent+label")
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Belum ada data tipe pekerjaan")

# ===== Chart 5: Average Salary by Category (Bar) =====
with col_chart5:
    st.markdown("### **5️⃣ Rata-rata Gaji per Kategori**")
    if stats and "average_salary" in stats:
        sal_df = pd.DataFrame(stats["average_salary"])
        if not sal_df.empty:
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=sal_df["category"],
                y=sal_df["avg_salary_min"],
                name="Gaji Min",
                marker_color="lightblue",
            ))
            fig.add_trace(go.Bar(
                x=sal_df["category"],
                y=sal_df["avg_salary_max"],
                name="Gaji Max",
                marker_color="darkblue",
            ))
            fig.update_layout(
                title="Rata-rata Gaji per Kategori (IDR)",
                xaxis_title="Kategori",
                yaxis_title="Gaji Rata-rata (IDR)",
                barmode="group",
                height=400,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Belum ada data gaji")

# ===== Chart 6: Jobs Posted Over Time (Line) =====
st.markdown("### **6️⃣ Lowongan per Hari (Bulan Ini)**")
if stats and "by_date" in stats:
    date_df = pd.DataFrame(stats["by_date"])
    if not date_df.empty:
        date_df["date"] = pd.to_datetime(date_df["date"])
        fig = px.line(
            date_df,
            x="date",
            y="count",
            title="Trend Lowongan per Hari",
            labels={"date": "Tanggal", "count": "Jumlah Lowongan"},
            markers=True,
            line_shape="spline",
        )
        fig.update_traces(line_color="green", line_width=3)
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Belum ada data timeline")

# ===== Row with 2 charts side by side =====
col_chart7, col_chart8 = st.columns(2)

# ===== Chart 7: Salary Distribution (Histogram) =====
with col_chart7:
    st.markdown("### **7️⃣ Distribusi Gaji**")
    if "salary_min" in df.columns and not df["salary_min"].isna().all():
        salary_data = df[df["salary_min"].notna()]["salary_min"]
        if not salary_data.empty:
            fig = px.histogram(
                salary_data,
                title="Distribusi Gaji Minimum",
                labels={"value": "Gaji Minimum (IDR)", "count": "Jumlah"},
                color_discrete_sequence=["purple"],
                nbins=20,
            )
            fig.update_layout(height=400, showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Belum ada data gaji")

# ===== Chart 8: Salary by Employment Type (Box Plot) =====
with col_chart8:
    st.markdown("### **8️⃣ Gaji vs Tipe Pekerjaan**")
    if "salary_min" in df.columns and "employment_type" in df.columns:
        salary_type_df = df[df["salary_min"].notna()]
        if not salary_type_df.empty:
            fig = px.box(
                salary_type_df,
                x="employment_type",
                y="salary_min",
                title="Distribusi Gaji per Tipe Pekerjaan",
                labels={"employment_type": "Tipe Pekerjaan", "salary_min": "Gaji Minimum (IDR)"},
                color="employment_type",
                color_discrete_sequence=px.colors.qualitative.Pastel,
            )
            fig.update_layout(height=400, showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Belum ada data gaji per tipe")

st.markdown("---")

# ===== Data Table with Export =====
st.markdown("### **📋 Data Lowongan**")
st.markdown(f"Menampilkan **{len(filtered_df)}** lowongan")

# Display data table
column_config = {
    "title": "Judul",
    "company": "Perusahaan",
    "location": "Lokasi",
    "category": "Kategori",
    "employment_type": "Tipe",
    "salary_min": "Gaji Min",
    "salary_max": "Gaji Max",
    "salary_currency": "Mata Uang",
    "posted_date": "Tanggal Posting",
    "source_name": "Sumber",
}

display_cols = [c for c in column_config.keys() if c in filtered_df.columns]
display_df = filtered_df[display_cols].copy()

# Format salary
if "salary_min" in display_df.columns:
    display_df["salary_min"] = display_df["salary_min"].apply(
        lambda x: f"Rp{x:,.0f}" if pd.notna(x) and x > 0 else "-"
    )
if "salary_max" in display_df.columns:
    display_df["salary_max"] = display_df["salary_max"].apply(
        lambda x: f"Rp{x:,.0f}" if pd.notna(x) and x > 0 else "-"
    )

display_df = display_df.rename(columns=column_config)

st.dataframe(
    display_df,
    use_container_width=True,
    height=400,
    hide_index=True,
)

# Export buttons
st.markdown("### **📥 Ekspor Data**")
export_col1, export_col2, export_col3 = st.columns(3)

with export_col1:
    csv_data = export_to_csv(filtered_df)
    st.download_button(
        label="📄 Download CSV",
        data=csv_data,
        file_name=f"datapulse_jobs_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv",
        use_container_width=True,
    )

with export_col2:
    excel_data = export_to_excel(filtered_df)
    st.download_button(
        label="📗 Download Excel",
        data=excel_data,
        file_name=f"datapulse_jobs_{datetime.now().strftime('%Y%m%d')}.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        use_container_width=True,
    )

with export_col3:
    # JSON export
    json_data = json.dumps(filtered_df.to_dict("records"), indent=2, default=str).encode()
    st.download_button(
        label="📋 Download JSON",
        data=json_data,
        file_name=f"datapulse_jobs_{datetime.now().strftime('%Y%m%d')}.json",
        mime="application/json",
        use_container_width=True,
    )

st.markdown("---")

# Footer
st.markdown(
    """
    ---
    **DataPulse** — Job Analytics Dashboard v1.0
    
    *Data contoh untuk keperluan demo/portofolio. Bukan data real-time.*
    
    [📖 Dokumentasi API](/docs) | [🐙 GitHub](https://github.com)
    """
)