import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  Search, Filter, X, TrendingUp, Building2, MapPin, Briefcase,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  LayoutDashboard, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { fetchStats, fetchJobs, fetchCategories, searchJobs } from './services/api'

const COLORS = {
  category: ['#ff8fab', '#b9a9e3', '#f5b07a', '#7dd3b4', '#ffd6a5', '#a8d8ea', '#f4a7b9', '#cdb4db'],
  employment: ['#ff8fab', '#b9a9e3', '#f5b07a', '#7dd3b4', '#ffd6a5'],
}

// Floating cherry blossom petals
function Petals() {
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 6}s`,
    size: `${8 + Math.random() * 10}px`,
    opacity: 0.3 + Math.random() * 0.4,
  }))
  return (
    <>
      {petals.map(p => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}
    </>
  )
}

function formatCurrency(value) {
  if (!value || value === 0) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const tooltipStyle = {
  backgroundColor: '#fff5f7',
  border: '1px solid #ffb8cb',
  borderRadius: '12px',
  color: '#3e3549',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(240,78,113,0.12)',
}

export default function App() {
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])

  useEffect(() => { loadData(); loadCategories() }, [])

  async function loadData() {
    setLoading(true); setError(null)
    try {
      const [statsData, jobsData] = await Promise.all([fetchStats(), fetchJobs(0, 200)])
      setStats(statsData)
      setJobs(jobsData.data || [])
      setFilteredJobs(jobsData.data || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function loadCategories() {
    try { const data = await fetchCategories(); setCategories(data.categories || []) }
    catch (e) { console.error(e) }
  }

  useEffect(() => {
    let filtered = [...jobs]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q)
      )
    }
    if (filterCategory) filtered = filtered.filter(j => j.category === filterCategory)
    setFilteredJobs(filtered)
  }, [searchQuery, filterCategory, jobs])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fff5f7 0%, #fdf8ee 50%, #f0ebff 100%)' }}>
      <Petals />
      <div className="text-center space-y-5 relative z-10">
        <div className="relative w-24 h-24 mx-auto animate-float">
          <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, #ffb8cb, #d8cff0)', opacity: 0.3 }}></div>
          <div className="absolute inset-2 rounded-full border-4 border-sakura-200 border-t-sakura-400 animate-spin"></div>
          <img src="/mashiro_logo.png" alt="Mashiro" className="w-10 h-10 rounded-2xl object-cover object-top shadow-sakura" />
        </div>
        <div>
          <p className="font-display font-semibold text-sakura-500 text-lg">DataPulse</p>
          <p className="text-mist-700/60 text-sm animate-pulse mt-1">Memuat data lowongan...</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #fff5f7, #fdf8ee)' }}>
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="text-4xl">😿</div>
        <h2 className="font-display font-bold text-xl text-mist-800">Koneksi Terputus</h2>
        <p className="text-mist-700/60 text-sm">Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.</p>
        <p className="text-sakura-400 text-xs font-mono bg-sakura-50 rounded-2xl p-2">{error}</p>
        <button onClick={loadData} className="btn-primary mx-auto">
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    </div>
  )

  const statCards = [
    { label: 'Total Lowongan', value: stats?.total_jobs || 0, emoji: '📋', gradient: 'from-sakura-100 to-sakura-50', accent: '#ff8fab' },
    { label: 'Perusahaan', value: stats?.by_company?.length || 0, emoji: '🏢', gradient: 'from-lavender-100 to-lavender-50', accent: '#b9a9e3' },
    { label: 'Lokasi', value: stats?.by_location?.length || 0, emoji: '📍', gradient: 'from-peach-100 to-peach-50', accent: '#f5b07a' },
    { label: 'Kategori', value: stats?.by_category?.length || 0, emoji: '🗂️', gradient: 'from-emerald-50 to-teal-50', accent: '#7dd3b4' },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(160deg, #fff5f7 0%, #fdf8ee 40%, #f0ebff 100%)' }}>
      <Petals />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-sakura-100/80" style={{ backgroundColor: 'rgba(255,248,243,0.92)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl shadow-sakura overflow-hidden" style={{ padding: 0 }}>
                <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwMDAgQDAwMEBAQFBgoGBgUFBgwICQcKDgwPDg4MDQ0PERYTDxAVEQ0NExoTFRcYGRkZDxIbHRsYHRYYGRj/2wBDAQQEBAYFBgsGBgsYEA0QGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCABIAEgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDds/B3iDXoTcaC9rqa/wAcMNyiTRH0aJyG/EZB9a5/VPBer6ffldWtbC3lJ5RrqJ5fqVjZm/MVFIM3xTAPJxkZxXvPwi+HcVvZW/izVLJHLfvbSJ1wqKP+WxHdj/AP+BelevmNWWGjzykmuitr+dvwPDwdCNdpKOvXXT8v1Lfwj+FEeiWkXiHVLL7LqMg/ch1HmQoe6qchWI7nLAcALya9Zt1FvaTvBuMjttG5i43Hgck8nnk/4UXs0qxW9qGCT3B2sw/gH8R/UAe5FXRDEkEaIMLGcqv0HFfHVKs6snOZ9RTowpRUYjJT9nt02tkKyqS3JIyAfx5pkwhaQSFEMi5QNjkeozTrhla0LZ4O0j8xWfcxSyJqcMUhSQsJIj6MVGP1WpWrNoo8X+O/w0HiXSW8RaHCqaxbLiWJRj7Wg6D/AH17HuOOwryf4Walc2fhDXIJbS7dI5o2LbBshJBB35IIPy9gelfTWp36al4akuoW2sqbnQfwkDkH+f4V4zqq6NFpfiK80791c3ccUl3CRjD8hXHruAYE/wB6M9zz7mW4hr91LbocmOy9P9/Fa9Sz4J8SadrHiM2li0knlozmQrtU9uM896K4r4IEv4wk/wCvd/5iilT0RNaHLKwmnaRE/imP+0I2a0QmSZFODIo/gB7Fjhc9gSe1fV3gsX1z4It7y/fM96wnKAYSKPPyIi9lCqMD3rlv+EX8Kvql1cJpti2EWKNFfOW6k9euSo/CvRra3S2itbWNcJDFsUDoAAFFZZhmcMa1ypq3f+v60MsJgJYRWk079ivIFfVTMx/1YP5KP8W/8dFLp1y1zBLKx6TMoHoBjAqn4gm8jSL94yUZoxEpXjGQST+RJrN0jVIY9BmuIrmF9s0UjhHDYViAw4PoCa8vlbVz0EtLs3iB9lSM/wDPQJ+T/wD1qZI0YuZtpPmYUt6Drj+tRXkzJIYom+fzNwx6lMD9SK5HUdcht/EV8xvod0VzGpTzQDtRucjPTbIw/KlCLb0NI6sjhhEeo63Yj7nnZA/2XUn+teD3t5/xT+rWkm0S+UWRj/eVsEfzr6BuF2eJ71h0kggfPrguv9BXzb4geO31u9WRgIhPIrbjgbd56+1d+Hq+yvUetj0YUfb0pw8l+A/4EJu8Xt727/zFFdH8J7GwsfEQitlhWZIXWQKwLD2IzxRW2GqqrDmXc8fFQanYf8Omni8bwX+roIrGxBu5nGD937qgdyzlQB3r6F8J63ca14bbU518uR7t12ddi7gAufoR+NeU/wDCLQwzMyqwLEE5PHHTj8T+deneFYEsfBLIcKBH9pyfck5/8cFRjaEKfvLqRGbmtS/qdvHqE8tq8YlVEmlZHG4btgVePxNZ+otb2GkwWhiijNzbMqR4C5KASDA/76FYXijTPFPiHxlLpuk6vf6dpU2ni7LaaVSa5cEr5XmH7g5B/GvIfA2i+NJPiJD4auPE2ploWkmms7uTz4lniAyFLEleC4yp546iso0r015nTSpSmpSj9nVn0HAVfxOloZAxitlcc53pn5T9RlQfp71jy28V/pt9JEI2T+09znjAALbs9s4PStrSbM2ukWmpTsTO5zKW42/Jjb9FCIPwJ7183fGHwtc3OsW1/dXs+o25tknWzSZytpgeY4dBgIHHQ9SATnNKnBRm2bYSm6snCL1/y1/Q90ZAs/zLiSOAQtnqdsjD/wCv+NfNnixYP+Ewvre6XMDXjh8gEbd+SMH2zXuvh3QYfCrXug2k9w9pCqTwrcSmZlWUs20OeSAVPXJrwnxswXxxeP8AwrqDk/Tcc10Rp8snFno5c+a/mjs/h75E/jiS8giiXzopZWZFAJ3MCMkdeveiqXwG0L+yLC6jcfvTKwYnk43SY/QCilg4clJJvv8AmeHi3eqz2m7t8Kdq5bt7ntWoX+yabeQq2YvsDRg57qWA/MK1MuV8qdJMfcPmY9dvIH57R+NVfEMNxZeB5BbNiZIrWNS3IJIOc+x3HP1p4yXM0hYeN3Y0fB+qxXM/2SVVZ4VaDB7owLL+WHX8R61J4Y8H3Oj6nHJcCxaG2Rkt3Tc02D8oySAANvUc5IFcB4M1N3+KEmhCURT3Gmi9tix/5awynKn2KuQfpntXudsVlhWTYyZGdrDBHsahRskjXESdGpOEdmZer2jzaNJbW42s7ryO3zDcfyzXK694MubvxHDqenajBZxGGO3uo3hLu6JkHYegJRihyPQ138ka79+3nGM1QvCqQszEBQMk+gHWnFa6mVGrKPws8+1CZJvFd6i7cxIq7R2GAB/6Ea+bfFiLd+KNS3ZI+0zPx6q5I/lXrfh7WJNS+JHiSViyszWgKN1jD+c4Ujsdu0n647V45fSNLrF87nJae7P5tIR/Sm7+9bc97Bx5eZLsen/CSaK8s/tkBBjuIYZ1I/2kbP6g0VmfAidE8OafYbcP9jWYH1BZ+PwJP50VVCSlC6PDxTvVkz3rUrctqHkj+BC7fgN389lXdZtI5dLSBh8rTxqfoFx/SiisMS9UZU3sfJ3xD8a3Hw6+P/h3V4fmewQmSLOPMQyMroT2yu4V9feE/FOjeLfDFrr+g3i3VjcrlG6Mh7o4/hYHgj+lFFbL4UzqxivK7NqQnO7ccYxt4x9a4X4m+L9L8GfD+/1nVbkQwom0Afecn+FR3Y9B9aKKSMcKlzo+dvgRrN14jj8S+J71QJb3VhIwHRQluSFHsA6j8K5BZkl1BJQcq8gf6hwD/wCzUUVpTV2z38C7uTZ6H8J0FhpugueMpFbsfZllH8wKKKKywi/dL5/mfP4l2mf/2Q==" alt="Mashiro" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}/>
              </div>
              <div>
                <h1 className="font-display font-bold text-mist-800 text-lg leading-none">DataPulse</h1>
                <p className="text-xs text-mist-700/50 hidden sm:block mt-0.5">Job Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-all text-sm ${showFilters ? 'bg-sakura-100 text-sakura-500' : 'text-mist-700/60 hover:bg-sakura-50 hover:text-sakura-400'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button onClick={loadData} className="p-2 rounded-xl text-mist-700/60 hover:bg-sakura-50 hover:text-sakura-400 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-10 space-y-5 sm:space-y-6 relative z-10">
        {/* Search */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sakura-300" />
            <input
              type="text"
              placeholder="Cari judul, perusahaan, atau deskripsi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm text-mist-800 placeholder-mist-700/40 border border-sakura-100 bg-white/70 backdrop-blur focus:outline-none focus:border-sakura-300 focus:ring-2 focus:ring-sakura-100 shadow-soft transition-all"
            />
          </div>

          {showFilters && (
            <div className="card animate-fade-in">
              <label className="block text-xs text-sakura-400 font-semibold mb-2">Kategori</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full sm:w-56 bg-white border border-sakura-100 rounded-xl px-3 py-2 text-sm text-mist-800 focus:outline-none focus:border-sakura-300 shadow-soft"
              >
                <option value="">Semua Kategori</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}

          {(searchQuery || filterCategory) && (
            <div className="flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <span className="filter-active">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterCategory && (
                <span className="filter-active">
                  {filterCategory}
                  <button onClick={() => setFilterCategory('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <span className="text-xs text-mist-700/50">{filteredJobs.length} lowongan ditemukan</span>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-xl mb-3 shadow-soft`}>
                {s.emoji}
              </div>
              <p className="stat-value">{s.value.toLocaleString('id-ID')}</p>
              <p className="stat-label mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {stats && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {/* Category Bar */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">📊</span>
                  <h3 className="card-header mb-0">Lowongan per Kategori</h3>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_category || []} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde8ef" />
                      <XAxis dataKey="category" tick={{ fill: '#9a84d5', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#9a84d5', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString('id-ID'), 'Lowongan']} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {(stats.by_category || []).map((_, i) => (
                          <Cell key={i} fill={COLORS.category[i % COLORS.category.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Employment Type Pie */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">🍩</span>
                  <h3 className="card-header mb-0">Tipe Pekerjaan</h3>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.by_employment_type || []}
                        dataKey="count"
                        nameKey="type"
                        cx="50%" cy="50%"
                        outerRadius={window.innerWidth < 640 ? 75 : 100}
                        innerRadius={window.innerWidth < 640 ? 38 : 55}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {(stats.by_employment_type || []).map((_, i) => (
                          <Cell key={i} fill={COLORS.employment[i % COLORS.employment.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {/* Top Companies */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">🏢</span>
                  <h3 className="card-header mb-0">Top 10 Perusahaan</h3>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_company || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde8ef" />
                      <XAxis type="number" tick={{ fill: '#9a84d5', fontSize: 11 }} />
                      <YAxis dataKey="company" type="category" tick={{ fill: '#9a84d5', fontSize: 11 }} width={window.innerWidth < 640 ? 80 : 120} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#f5b07a" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Locations */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">📍</span>
                  <h3 className="card-header mb-0">Top 10 Lokasi</h3>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_location || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde8ef" />
                      <XAxis type="number" tick={{ fill: '#9a84d5', fontSize: 11 }} />
                      <YAxis dataKey="location" type="category" tick={{ fill: '#9a84d5', fontSize: 11 }} width={window.innerWidth < 640 ? 80 : 120} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#b9a9e3" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Trend Line */}
            {stats.by_date && stats.by_date.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">📈</span>
                  <h3 className="card-header mb-0">Lowongan per Hari (Bulan Ini)</h3>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.by_date} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde8ef" />
                      <XAxis dataKey="date" tick={{ fill: '#9a84d5', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9a84d5', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="count" stroke="#ff8fab" strokeWidth={2.5} dot={{ fill: '#ff8fab', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Data Table */}
        <div className="card">
          <button onClick={() => setShowTable(!showTable)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h3 className="card-header mb-0">Data Lowongan</h3>
              <span className="text-xs text-mist-700/40 font-normal">({filteredJobs.length})</span>
            </div>
            {showTable
              ? <ChevronUp className="w-4 h-4 text-sakura-300" />
              : <ChevronDown className="w-4 h-4 text-sakura-300" />}
          </button>

          {showTable && (
            <div className="mt-4 overflow-x-auto animate-fade-in">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-sakura-100">
                    <th className="text-left py-2 px-3 text-sakura-400 font-semibold text-xs">Judul</th>
                    <th className="text-left py-2 px-3 text-sakura-400 font-semibold text-xs hidden sm:table-cell">Perusahaan</th>
                    <th className="text-left py-2 px-3 text-sakura-400 font-semibold text-xs hidden md:table-cell">Lokasi</th>
                    <th className="text-left py-2 px-3 text-sakura-400 font-semibold text-xs hidden lg:table-cell">Kategori</th>
                    <th className="text-right py-2 px-3 text-sakura-400 font-semibold text-xs">Gaji</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.slice(0, 50).map((job) => (
                    <tr key={job.id} className="border-b border-sakura-50 hover:bg-sakura-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="text-mist-800 font-medium text-xs sm:text-sm">{job.title}</div>
                        <div className="text-xs text-mist-700/50 sm:hidden">{job.company}</div>
                      </td>
                      <td className="py-2.5 px-3 text-mist-700/80 hidden sm:table-cell text-xs">{job.company}</td>
                      <td className="py-2.5 px-3 text-mist-700/60 hidden md:table-cell text-xs">{job.location || '-'}</td>
                      <td className="py-2.5 px-3 hidden lg:table-cell">
                        {job.category && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lavender-100 text-lavender-500">
                            {job.category}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-mist-700/80 text-xs font-medium">
                        {formatCurrency(job.salary_min || job.salary_max)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredJobs.length > 50 && (
                <p className="text-center text-mist-700/40 text-xs mt-3">Menampilkan 50 dari {filteredJobs.length} lowongan</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-mist-700/30">DataPulse v1.0 🌸 Data demo untuk keperluan portofolio</p>
        </div>
      </main>
    </div>
  )
}
