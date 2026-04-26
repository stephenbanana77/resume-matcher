'use client'

import { useState } from 'react'
import { ClipboardList, X, Loader2 } from 'lucide-react'

interface Props {
  analysisId: string
}

export default function LogApplicationModal({ analysisId }: Props) {
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, position, analysisId, notes }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || '记录失败')
    } else {
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false) }, 1200)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full border border-gray-700 hover:border-purple-500 hover:text-purple-400 text-gray-300 rounded-xl py-3 text-sm font-medium transition-colors"
      >
        <ClipboardList size={16} />
        记录投递
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">记录这次投递</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <p className="text-green-400 text-center py-4">已记录 ✓</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">公司名称</label>
                  <input
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                    placeholder="例：字节跳动"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">岗位名称</label>
                  <input
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    required
                    placeholder="例：后端开发实习"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">备注（选填）</label>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="渠道、联系人等..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  确认记录
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
