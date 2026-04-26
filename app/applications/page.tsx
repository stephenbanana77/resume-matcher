'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Trash2, ChevronDown } from 'lucide-react'

interface Application {
  id: string
  company: string
  position: string
  status: string
  applied_at: string
  notes: string | null
  analysis_id: string | null
  analyses: { result: { score: number } } | null
}

const STATUS_OPTIONS = [
  { value: 'applied',   label: '已投递', color: 'text-gray-400 border-gray-600 bg-gray-800' },
  { value: 'viewed',    label: '已读',   color: 'text-blue-400 border-blue-600 bg-blue-900/30' },
  { value: 'interview', label: '约面',   color: 'text-yellow-400 border-yellow-600 bg-yellow-900/30' },
  { value: 'offer',     label: 'Offer',  color: 'text-green-400 border-green-600 bg-green-900/30' },
  { value: 'rejected',  label: '已拒绝', color: 'text-red-400 border-red-600 bg-red-900/30' },
]

function statusStyle(value: string) {
  return STATUS_OPTIONS.find(s => s.value === value) ?? STATUS_OPTIONS[0]
}

function Stats({ apps }: { apps: Application[] }) {
  const total = apps.length
  const interviews = apps.filter(a => ['interview', 'offer'].includes(a.status)).length
  const offers = apps.filter(a => a.status === 'offer').length
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: '总投递', value: total },
        { label: '约面率', value: `${interviewRate}%` },
        { label: '已收 Offer', value: offers },
      ].map(({ label, value }) => (
        <div key={label} className="bg-gray-900 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-gray-400 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setApps(data) })
      .finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function deleteApp(id: string) {
    setApps(prev => prev.filter(a => a.id !== id))
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">投递追踪</h1>
        <p className="text-gray-400 text-sm mb-8">记录每次投递进展，统计约面率</p>

        {!loading && <Stats apps={apps} />}

        {loading ? (
          <p className="text-gray-500 text-sm text-center py-10">加载中...</p>
        ) : apps.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">还没有投递记录</p>
            <p className="text-xs mt-1">在分析结果页点击「记录投递」开始追踪</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const st = statusStyle(app.status)
              return (
                <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{app.company}</span>
                        <span className="text-gray-500 text-sm">·</span>
                        <span className="text-gray-300 text-sm">{app.position}</span>
                        {app.analyses?.result?.score != null && (
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                            匹配 {app.analyses.result.score}分
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(app.applied_at).toLocaleDateString('zh-CN')}
                        </span>
                        {app.notes && (
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">{app.notes}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <select
                          value={app.status}
                          onChange={e => updateStatus(app.id, e.target.value)}
                          className={`appearance-none pl-3 pr-7 py-1.5 rounded-lg border text-xs font-medium cursor-pointer focus:outline-none ${st.color}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
