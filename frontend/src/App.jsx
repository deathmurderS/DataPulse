import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  Search, Filter, X, Download, TrendingUp, Building2, MapPin, Briefcase,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  LayoutDashboard, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'
import { fetchStats, fetchJobs, fetchCategories, searchJobs } from './services/api'

const COLORS = {
  category: ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee', '#f87171'],
  employment: ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c'],
}

function formatCurrency(value) {
  if (!value || value === 0) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary-400" />
            </div>
          </div>
          <p className="text-gray-400 animate-pulse">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Koneksi Gagal</h2>
          <p className="text-gray-400 text-sm">Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.</p>
          <p className="text-red-400 text-xs font-mono bg-gray-800 rounded p-2">{error}</p>
          <button onClick={loadData} className="btn-primary">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Lowongan', value: stats?.total_jobs || 0, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Perusahaan', value: stats?.by_company?.length || 0, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Lokasi', value: stats?.by_location?.length || 0, icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Kategori', value: stats?.by_category?.length || 0, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                </div>
                <div className="scan-line"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DataPulse</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Job Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button onClick={loadData} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8 space-y-4 sm:space-y-6">
        {/* Search & Filters */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari judul, perusahaan, atau deskripsi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          {showFilters && (
            <div className="card animate-fade-in space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50"
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="stat-value">{stat.value.toLocaleString('id-ID')}</p>
              <p className="stat-label mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {stats && (
          <>
            {/* Chart Row 1: Category & Employment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Category Chart */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-primary-400" />
                  <h3 className="card-header mb-0">Lowongan per Kategori</h3>
                </div>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_category || []} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => [value.toLocaleString('id-ID'), 'Lowongan']}
                      />
                      <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Employment Type Pie */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="card-header mb-0">Tipe Pekerjaan</h3>
                </div>
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
                      >
                        {(stats.by_employment_type || []).map((_, i) => (
                          <Cell key={i} fill={COLORS.employment[i % COLORS.employment.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart Row 2: Company & Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <h3 className="card-header mb-0">Top 10 Perusahaan</h3>
                </div>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_company || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis dataKey="company" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={window.innerWidth < 640 ? 80 : 120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#34d399" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <h3 className="card-header mb-0">Top 10 Lokasi</h3>
                </div>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_location || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis dataKey="location" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={window.innerWidth < 640 ? 80 : 120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Jobs Over Time */}
            {stats.by_date && stats.by_date.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <LineChartIcon className="w-4 h-4 text-rose-400" />
                  <h3 className="card-header mb-0">Lowongan per Hari (Bulan Ini)</h3>
                </div>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.by_date} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Data Table */}
        <div className="card">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-primary-400" />
              <h3 className="card-header mb-0">Data Lowongan</h3>
              <span className="text-xs text-gray-500">({filteredJobs.length})</span>
            </div>
            {showTable ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showTable && (
            <div className="mt-4 overflow-x-auto animate-fade-in">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Judul</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium hidden sm:table-cell">Perusahaan</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium hidden md:table-cell">Lokasi</th>
                    <th className="text-left py-2 px-3 text-gray-400 font-medium hidden lg:table-cell">Kategori</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Gaji</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.slice(0, 50).map((job) => (
                    <tr key={job.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-2 px-3">
                        <div className="text-white text-xs sm:text-sm">{job.title}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{job.company}</div>
                      </td>
                      <td className="py-2 px-3 text-gray-300 hidden sm:table-cell">{job.company}</td>
                      <td className="py-2 px-3 text-gray-400 hidden md:table-cell">{job.location || '-'}</td>
                      <td className="py-2 px-3 hidden lg:table-cell">
                        {job.category && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400">
                            {job.category}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-300 text-xs sm:text-sm">
                        {formatCurrency(job.salary_min || job.salary_max)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredJobs.length > 50 && (
                <p className="text-center text-gray-500 text-xs mt-3">Menampilkan 50 dari {filteredJobs.length} lowongan</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-600">
            DataPulse v1.0 • Data demo untuk keperluan portofolio
          </p>
        </div>
      </main>
    </div>
  )
}

export default App