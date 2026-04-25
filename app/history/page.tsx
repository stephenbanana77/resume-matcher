'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Trash2, ChevronRight } from 'lucide-react'

interface HistoryItem {
  id: string
  jd_text: string
  created_at: string
  result: { score: number; tier: { level: string } }
}

const TIER_COLORS: Record<string, string> = {
  '优秀候选人': 'text-green-400',
  '合格候选人': 'text-blue-400',
  '初级候选人': 'text-yellow-400',
  '不匹配': 'text-red-400',
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
  }, [])

  async function handleDelete(id: string) {
    await fetch('/api/history', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">历史记录</h1>

        {loading ? (
          <p className="text-gray-400 text-sm">加载中...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>暂无分析记录</p>
            <Link href="/analyze" className="text-blue-400 text-sm mt-2 inline-block hover:text-blue-300">
              去分析第一份简历 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-gray-900 rounded-xl p-4 flex items-center gap-4 group">
                <div className="text-2xl font-bold text-white w-12 text-center">{item.result.score}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${TIER_COLORS[item.result.tier.level] || 'text-gray-300'}`}>
                    {item.result.tier.level}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5 truncate">{item.jd_text.slice(0, 80)}...</div>
                  <div className="text-gray-600 text-xs mt-1">{new Date(item.created_at).toLocaleString('zh-CN')}</div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-400 p-1">
                    <Trash2 size={16} />
                  </button>
                  <Link href={`/result/${item.id}`} className="text-gray-400 hover:text-white p-1">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
