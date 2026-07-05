import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import {
  Search, Filter, X, Briefcase, Building2, MapPin, LayoutGrid,
  RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { fetchStats, fetchJobs, fetchCategories, searchJobs } from './services/api'

const SIGNAL = ['#FFB020', '#4FBDAE', '#E1637A', '#7C93B8', '#A9A15C', '#B084C4', '#FFB020', '#4FBDAE']
const TOOLTIP_STYLE = { backgroundColor: '#191D20', border: '1px solid #2A2F33', borderRadius: '4px', color: '#EDEAE2', fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }
const AXIS_STYLE = { fill: '#9BA0A6', fontSize: 11, fontFamily: '"IBM Plex Mono", monospace' }

function formatCurrency(value) {
  if (!value || value === 0) return '\u2014'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

// Literal ECG/market-pulse trace — the app's one signature element.
function PulseTrace({ className }) {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className={className}>
      <path
        d="M0 20 L60 20 L75 20 L85 4 L95 36 L105 20 L120 20 L400 20"
        fill="none"
        stroke="#FFB020"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="240"
        className="animate-trace"
      />
    </svg>
  )
}

function App() {
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

  useEffect(() => {
    loadData()
    loadCategories()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [statsData, jobsData] = await Promise.all([
        fetchStats(),
        fetchJobs(0, 200),
      ])
      setStats(statsData)
      setJobs(jobsData.data || [])
      setFilteredJobs(jobsData.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const data = await fetchCategories()
      setCategories(data.categories || [])
    } catch (e) {
      console.error('Failed to load categories:', e)
    }
  }

  function handleSearch() {
    if (!searchQuery && !filterCategory) {
      setFilteredJobs(jobs)
      return
    }
    let filtered = [...jobs]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q)
      )
    }
    if (filterCategory) {
      filtered = filtered.filter(j => j.category === filterCategory)
    }
    setFilteredJobs(filtered)
  }

  useEffect(() => {
    handleSearch()
  }, [searchQuery, filterCategory, jobs])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center font-sans">
        <div className="text-center space-y-4 w-56">
          <PulseTrace className="w-full h-10" />
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-paper-dim">Membaca sinyal&hellip;</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 font-sans">
        <div className="panel max-w-md w-full text-center space-y-4 p-6">
          <div className="w-12 h-12 border border-signal-rose/40 rounded-sm flex items-center justify-center mx-auto">
            <X className="w-5 h-5 text-signal-rose" />
          </div>
          <h2 className="text-lg font-semibold text-paper">Koneksi Gagal</h2>
          <p className="text-paper-dim text-sm">Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.</p>
          <p className="text-signal-rose text-xs font-mono bg-ink-850 border border-ink-800 rounded-sm p-2">{error}</p>
          <button onClick={loadData} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider border border-pulse-dim text-pulse bg-pulse-soft px-4 py-2 rounded-sm hover:bg-pulse hover:text-ink-950 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Lowongan', value: stats?.total_jobs || 0, icon: Briefcase },
    { label: 'Perusahaan', value: stats?.by_company?.length || 0, icon: Building2 },
    { label: 'Lokasi', value: stats?.by_location?.length || 0, icon: MapPin },
    { label: 'Kategori', value: stats?.by_category?.length || 0, icon: LayoutGrid },
  ]

  return (
    <div className="min-h-screen bg-ink-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-ink-950/95 backdrop-blur border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-pulse animate-pulse" />
              <div>
                <h1 className="font-mono text-base font-semibold text-paper tracking-tight">DataPulse</h1>
                <p className="text-[11px] font-mono text-paper-faint hidden sm:block uppercase tracking-[0.12em]">Job Analytics &mdash; Live Feed</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Filter"
                className={`p-2 rounded-sm transition-colors ${showFilters ? 'bg-pulse-soft text-pulse border border-pulse-dim' : 'text-paper-dim hover:text-paper hover:bg-ink-800 border border-transparent'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button onClick={loadData} aria-label="Refresh" className="p-2 rounded-sm text-paper-dim hover:text-paper hover:bg-ink-800 border border-transparent transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <PulseTrace className="w-full h-6 mt-1" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8 space-y-4 sm:space-y-6">
        {/* Search & Filters */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-faint" />
            <input
              type="text"
              placeholder="Cari judul, perusahaan, atau deskripsi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-ink-900 border border-ink-800 rounded-md pl-10 pr-4 py-3 text-sm font-mono text-paper placeholder-paper-faint focus:outline-none focus:border-pulse-dim transition-colors"
            />
          </div>

          {showFilters && (
            <div className="panel animate-fade-in p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-paper-faint mb-1">Kategori</label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full bg-ink-850 border border-ink-800 rounded-sm px-3 py-2 text-sm font-mono text-paper focus:outline-none focus:border-pulse-dim"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPI Ticker Strip */}
        <div className="panel grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-ink-800">
          {statCards.map((stat, i) => (
            <div key={i} className="p-4 sm:p-5 animate-slide-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <stat.icon className="w-3.5 h-3.5 text-pulse" />
                <p className="readout-label">{stat.label}</p>
              </div>
              <p className="readout-value">{stat.value.toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {stats && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="panel p-4 sm:p-6">
                <h3 className="panel-header">Lowongan per Kategori</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_category || []} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#1D2124" vertical={false} />
                      <XAxis dataKey="category" tick={AXIS_STYLE} angle={-20} textAnchor="end" height={60} axisLine={{ stroke: '#2A2F33' }} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [value.toLocaleString('id-ID'), 'Lowongan']} />
                      <Bar dataKey="count" fill="#FFB020" radius={[2, 2, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel p-4 sm:p-6">
                <h3 className="panel-header">Tipe Pekerjaan</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.by_employment_type || []}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={window.innerWidth < 640 ? 70 : 100}
                        innerRadius={window.innerWidth < 640 ? 35 : 50}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        stroke="#0C0E10"
                        strokeWidth={2}
                      >
                        {(stats.by_employment_type || []).map((_, i) => (
                          <Cell key={i} fill={SIGNAL[i % SIGNAL.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="panel p-4 sm:p-6">
                <h3 className="panel-header">Top 10 Perusahaan</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_company || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#1D2124" horizontal={false} />
                      <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis dataKey="company" type="category" tick={AXIS_STYLE} width={window.innerWidth < 640 ? 80 : 120} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill="#4FBDAE" radius={[0, 2, 2, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel p-4 sm:p-6">
                <h3 className="panel-header">Top 10 Lokasi</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_location || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#1D2124" horizontal={false} />
                      <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis dataKey="location" type="category" tick={AXIS_STYLE} width={window.innerWidth < 640 ? 80 : 120} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill="#B084C4" radius={[0, 2, 2, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {stats.by_date && stats.by_date.length > 0 && (
              <div className="panel p-4 sm:p-6">
                <h3 className="panel-header">Lowongan per Hari (Bulan Ini)</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.by_date} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#1D2124" vertical={false} />
                      <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={{ stroke: '#2A2F33' }} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="count" stroke="#E1637A" strokeWidth={1.5} dot={{ fill: '#E1637A', r: 2.5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Data Table */}
        <div className="panel p-4 sm:p-6">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <h3 className="panel-header mb-0">Data Lowongan</h3>
              <span className="text-[11px] font-mono text-paper-faint">[{filteredJobs.length}]</span>
            </div>
            {showTable ? <ChevronUp className="w-4 h-4 text-paper-dim" /> : <ChevronDown className="w-4 h-4 text-paper-dim" />}
          </button>

          {showTable && (
            <div className="mt-4 overflow-x-auto animate-fade-in">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-ink-800">
                    <th className="text-left py-2 px-3 text-paper-faint font-medium text-[11px] uppercase tracking-wider">Judul</th>
                    <th className="text-left py-2 px-3 text-paper-faint font-medium text-[11px] uppercase tracking-wider hidden sm:table-cell">Perusahaan</th>
                    <th className="text-left py-2 px-3 text-paper-faint font-medium text-[11px] uppercase tracking-wider hidden md:table-cell">Lokasi</th>
                    <th className="text-left py-2 px-3 text-paper-faint font-medium text-[11px] uppercase tracking-wider hidden lg:table-cell">Kategori</th>
                    <th className="text-right py-2 px-3 text-paper-faint font-medium text-[11px] uppercase tracking-wider">Gaji</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.slice(0, 50).map((job) => (
                    <tr key={job.id} className="border-b border-ink-800/60 hover:bg-pulse-soft transition-colors">
                      <td className="py-2 px-3">
                        <div className="text-paper text-xs sm:text-sm">{job.title}</div>
                        <div className="text-xs text-paper-faint sm:hidden">{job.company}</div>
                      </td>
                      <td className="py-2 px-3 text-paper-dim hidden sm:table-cell">{job.company}</td>
                      <td className="py-2 px-3 text-paper-dim hidden md:table-cell">{job.location || '\u2014'}</td>
                      <td className="py-2 px-3 hidden lg:table-cell">
                        {job.category && (
                          <span className="tag-pill">{job.category}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-paper-dim text-xs sm:text-sm tabular-nums">
                        {formatCurrency(job.salary_min || job.salary_max)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredJobs.length > 50 && (
                <p className="text-center text-paper-faint text-xs mt-3 font-mono">Menampilkan 50 dari {filteredJobs.length} lowongan</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[11px] font-mono text-paper-faint tracking-wide">
            DataPulse v1.0 &middot; Data demo untuk keperluan portofolio
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
