const API_BASE = '/api'

export async function fetchJobs(skip = 0, limit = 100) {
  const res = await fetch(`${API_BASE}/jobs?skip=${skip}&limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/jobs/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/jobs/categories`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function fetchCompanies() {
  const res = await fetch(`${API_BASE}/jobs/companies`)
  if (!res.ok) throw new Error('Failed to fetch companies')
  return res.json()
}

export async function searchJobs(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value)
  })
  const res = await fetch(`${API_BASE}/jobs/search?${query}`)
  if (!res.ok) throw new Error('Failed to search jobs')
  return res.json()
}

export async function healthCheck() {
  const res = await fetch('/health')
  if (!res.ok) throw new Error('API not available')
  return res.json()
}