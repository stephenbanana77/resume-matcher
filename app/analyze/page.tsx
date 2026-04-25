'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Upload, FileText, Loader2 } from 'lucide-react'

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTip, setLoadingTip] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !jd.trim()) return
    setLoading(true)
    setError('')
    setLoadingTip('正在解析 PDF...')
    await new Promise(r => setTimeout(r, 800))
    setLoadingTip('AI 分析中，通常需要 15-30 秒...')

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('jd', jd)

    const res = await fetch('/api/analyze', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '分析失败')
      setLoading(false)
      return
    }

    router.push(`/result/${data.id}`)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">分析简历匹配度</h1>
        <p className="text-gray-400 text-sm mb-8">上传你的简历 PDF，粘贴目标岗位 JD，AI 给出详细分析</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PDF 上传 */}
          <div>
            <label className="block text-sm font-medium mb-2">简历 PDF</label>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <FileText size={20} />
                  <span className="text-sm">{file.name}</span>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload size={28} className="mx-auto mb-2" />
                  <p className="text-sm">拖拽 PDF 到此处，或点击上传</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
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
            disabled={loading || !file || !jd.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {loadingTip}
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
