'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Upload, FileText, Loader2, Trash2, CheckCircle2 } from 'lucide-react'

interface StoredResume {
  id: string
  filename: string
  created_at: string
}

export default function AnalyzePage() {
  const [resumes, setResumes] = useState<StoredResume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [jd, setJd] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/resumes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setResumes(data)
      })
  }, [])

  async function handleUploadResume(file: File) {
    setUploadingResume(true)
    setError('')
    const formData = new FormData()
    formData.append('resume', file)
    const res = await fetch('/api/resumes', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '上传失败')
    } else {
      setResumes(prev => [data, ...prev])
      setSelectedResumeId(data.id)
    }
    setUploadingResume(false)
  }

  async function handleDeleteResume(id: string) {
    await fetch('/api/resumes', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    })
    setResumes(prev => prev.filter(r => r.id !== id))
    if (selectedResumeId === id) setSelectedResumeId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedResumeId || !jd.trim()) return
    setAnalyzing(true)
    setError('')
    setProgress('连接 AI...')
    setCharCount(0)

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeId: selectedResumeId, jdText: jd }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok || !res.body) {
      setError('请求失败')
      setAnalyzing(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    setProgress('AI 分析中...')

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
            router.push(`/result/${parsed.id}`)
            return
          } else if (parsed.type === 'error') {
            setError(parsed.message)
            setAnalyzing(false)
            return
          }
        } catch {}
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">分析简历匹配度</h1>
        <p className="text-gray-400 text-sm mb-8">选择简历，粘贴 JD，AI 实时分析匹配情况</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 简历选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择简历</label>

            {resumes.length > 0 && (
              <div className="space-y-2 mb-3">
                {resumes.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResumeId(r.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedResumeId === r.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedResumeId === r.id ? (
                        <CheckCircle2 size={16} className="text-blue-400" />
                      ) : (
                        <FileText size={16} className="text-gray-400" />
                      )}
                      <span className="text-sm">{r.filename}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleDeleteResume(r.id) }}
                      className="text-gray-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {uploadingResume ? (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">解析中...</span>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload size={22} className="mx-auto mb-1" />
                  <p className="text-sm">上传新简历 PDF</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleUploadResume(f)
                e.target.value = ''
              }}
            />
          </div>

          {/* JD 输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">岗位描述 (JD)</label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="粘贴招聘 JD 内容..."
              rows={10}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={analyzing || !selectedResumeId || !jd.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {progress}
                {charCount > 0 && (
                  <span className="text-blue-300 text-sm">（已生成 {charCount} 字）</span>
                )}
              </>
            ) : (
              '开始分析'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
