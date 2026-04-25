'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import JDAnalysisResult from '@/components/JDAnalysisResult'
import { JDAnalysisResult as JDResult } from '@/lib/jd-analysis'
import { Loader2, Search } from 'lucide-react'

type State = 'idle' | 'loading' | 'done' | 'error'

export default function JDPage() {
  const [jd, setJd] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<JDResult | null>(null)
  const [charCount, setCharCount] = useState(0)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jd.trim()) return

    setState('loading')
    setCharCount(0)
    setError('')
    setResult(null)

    const res = await fetch('/api/jd-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jdText: jd }),
    })

    if (!res.ok || !res.body) {
      setState('error')
      setError('请求失败，请重试')
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const parsed = JSON.parse(line.slice(6))
          if (parsed.type === 'chunk') {
            setCharCount(c => c + parsed.content.length)
          } else if (parsed.type === 'done') {
            setResult(parsed.result)
            setState('done')
          } else if (parsed.type === 'error') {
            setError(parsed.message)
            setState('error')
          }
        } catch {}
      }
    }
  }

  function handleReset() {
    setState('idle')
    setResult(null)
    setJd('')
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">岗位解读</h1>
          <p className="text-gray-400 text-sm">
            粘贴任意岗位 JD，AI 拆解真实要求、核心职责和成长路径
          </p>
        </div>

        {state !== 'done' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="粘贴招聘 JD 内容..."
              rows={12}
              required
              disabled={state === 'loading'}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={state === 'loading' || !jd.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  AI 解读中...
                  {charCount > 0 && (
                    <span className="text-blue-300 text-sm">（已生成 {charCount} 字）</span>
                  )}
                </>
              ) : (
                <>
                  <Search size={18} />
                  解读岗位要求
                </>
              )}
            </button>
          </form>
        )}

        {state === 'done' && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div />
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← 解读新岗位
              </button>
            </div>
            <JDAnalysisResult result={result} />
          </div>
        )}
      </main>
    </div>
  )
}
