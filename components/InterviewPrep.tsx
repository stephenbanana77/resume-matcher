'use client'

import { useState } from 'react'
import { Loader2, BrainCircuit, ChevronDown, ChevronUp, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { InterviewPrepResult, InterviewQuestion } from '@/lib/interview'
import { AnswerEvaluation } from '@/lib/interview-eval'

const TYPE_STYLES: Record<InterviewQuestion['type'], string> = {
  '技术考察': 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  '项目追问': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  '差距应对': 'bg-red-500/10 text-red-300 border-red-500/30',
  '行为问题': 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
}

const RATING_STYLES: Record<AnswerEvaluation['rating'], string> = {
  '优秀': 'text-green-400 bg-green-400/10 border-green-400/30',
  '良好': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  '一般': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  '需改进': 'text-red-400 bg-red-400/10 border-red-400/30',
}

// ─── Read mode card ───────────────────────────────────────────────────────────

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-gray-500 text-sm font-mono w-5 shrink-0 mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-block mb-1.5 ${TYPE_STYLES[q.type]}`}>
            {q.type}
          </span>
          <p className="text-sm text-gray-100">{q.question}</p>
        </div>
        <span className="text-gray-500 shrink-0 mt-1">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">为什么会被问</p>
            <p className="text-sm text-gray-400">{q.why}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">建议回答思路</p>
            <p className="text-sm text-gray-200 bg-gray-800 rounded-lg px-3 py-2 leading-relaxed">{q.approach}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Practice mode card ───────────────────────────────────────────────────────

function EvaluationView({ eval: ev }: { eval: AnswerEvaluation }) {
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <span className={`text-sm px-3 py-1 rounded-full border font-medium ${RATING_STYLES[ev.rating]}`}>
          {ev.rating}
        </span>
      </div>
      {ev.strengths.length > 0 && (
        <div className="space-y-1">
          {ev.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" />
              {s}
            </div>
          ))}
        </div>
      )}
      {ev.missing.length > 0 && (
        <div className="space-y-1">
          {ev.missing.map((m, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              {m}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2">{ev.suggestion}</p>
    </div>
  )
}

interface PracticeCardProps {
  q: InterviewQuestion
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}

function PracticeCard({ q, index, total, onPrev, onNext }: PracticeCardProps) {
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [showApproach, setShowApproach] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!answer.trim() || evaluating) return
    setEvaluating(true)
    setError('')
    setEvaluation(null)

    const res = await fetch('/api/interview-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q.question, approach: q.approach, answer }),
    })

    if (!res.ok || !res.body) {
      setError('评价失败，请重试')
      setEvaluating(false)
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
          if (parsed.type === 'done') {
            setEvaluation(parsed.evaluation)
          } else if (parsed.type === 'error') {
            setError(parsed.message)
          }
        } catch {}
      }
    }
    setEvaluating(false)
  }

  function handleRedo() {
    setAnswer('')
    setEvaluation(null)
    setShowApproach(false)
    setError('')
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>第 {index + 1} / {total} 题</span>
        <span className={`px-2 py-0.5 rounded-full border font-medium ${TYPE_STYLES[q.type]}`}>{q.type}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800 rounded-full">
        <div
          className="h-1 bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <p className="text-base text-white leading-relaxed">{q.question}</p>

      {/* Why */}
      <p className="text-xs text-gray-500">{q.why}</p>

      {/* Answer area */}
      <div className="space-y-2">
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="写下你的回答..."
          rows={5}
          disabled={evaluating}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50 placeholder-gray-600"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || evaluating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {evaluating ? (
              <><Loader2 size={14} className="animate-spin" />AI 评价中...</>
            ) : (
              '提交回答'
            )}
          </button>
          {evaluation && (
            <button
              onClick={handleRedo}
              title="重新作答"
              className="px-3 py-2.5 border border-gray-700 hover:border-gray-500 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Evaluation */}
      {evaluation && <EvaluationView eval={evaluation} />}

      {/* Reference approach (revealed after submitting) */}
      {evaluation && (
        <div>
          <button
            onClick={() => setShowApproach(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            {showApproach ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showApproach ? '收起参考思路' : '查看参考思路'}
          </button>
          {showApproach && (
            <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2 mt-2 leading-relaxed">
              {q.approach}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />上一题
        </button>
        <button
          onClick={onNext}
          disabled={index === total - 1}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          下一题<ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InterviewPrep({ analysisId }: { analysisId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [prep, setPrep] = useState<InterviewPrepResult | null>(null)
  const [charCount, setCharCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [context, setContext] = useState('')
  const [mode, setMode] = useState<'read' | 'practice'>('read')
  const [practiceIndex, setPracticeIndex] = useState(0)

  async function generate() {
    setState('loading')
    setCharCount(0)
    setErrorMsg('')
    setMode('read')
    setPracticeIndex(0)

    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId, context: context.trim() || undefined }),
    })

    if (!res.ok || !res.body) {
      setState('error')
      setErrorMsg('请求失败，请重试')
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
            setPrep(parsed.result)
            setState('done')
          } else if (parsed.type === 'error') {
            setErrorMsg(parsed.message)
            setState('error')
          }
        } catch {}
      }
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold flex items-center gap-2">
          <BrainCircuit size={18} className="text-blue-400" />
          面试题预测
        </h2>
        {state === 'done' && (
          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setMode('read')}
                className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'read' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                阅读
              </button>
              <button
                onClick={() => { setMode('practice'); setPracticeIndex(0) }}
                className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'practice' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                练习
              </button>
            </div>
            <button onClick={generate} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              重新生成
            </button>
          </div>
        )}
      </div>

      {/* Idle */}
      {state === 'idle' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            基于你的缺口分析，AI 预测面试官最可能问的 8 道题，并给出回答思路
          </p>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              公司 / 面试背景
              <span className="text-gray-600 font-normal ml-1">（选填，填了更精准）</span>
            </label>
            <input
              type="text"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="如：字节跳动，技术面3轮，算法要求高"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <button
            onClick={generate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-xl font-medium transition-colors"
          >
            生成面试题
          </button>
        </div>
      )}

      {/* Loading */}
      {state === 'loading' && (
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={24} className="animate-spin mx-auto mb-3 text-blue-400" />
          <p className="text-sm">AI 分析中，正在生成面试题...</p>
          {charCount > 0 && <p className="text-xs text-gray-600 mt-1">已生成 {charCount} 字</p>}
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm mb-3">{errorMsg}</p>
          <button onClick={generate} className="text-blue-400 hover:text-blue-300 text-sm">重试</button>
        </div>
      )}

      {/* Done — read mode */}
      {state === 'done' && prep && mode === 'read' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {prep.questions.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} />
            ))}
          </div>
          {prep.tips && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 mt-2">
              <p className="text-xs text-blue-400 font-medium mb-1">整体准备建议</p>
              <p className="text-sm text-gray-300">{prep.tips}</p>
            </div>
          )}
        </div>
      )}

      {/* Done — practice mode */}
      {state === 'done' && prep && mode === 'practice' && (
        <PracticeCard
          key={practiceIndex}
          q={prep.questions[practiceIndex]}
          index={practiceIndex}
          total={prep.questions.length}
          onPrev={() => setPracticeIndex(i => i - 1)}
          onNext={() => setPracticeIndex(i => i + 1)}
        />
      )}
    </div>
  )
}
