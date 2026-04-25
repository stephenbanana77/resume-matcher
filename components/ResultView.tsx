'use client'

import { AnalysisResult } from '@/lib/deepseek'
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react'

const TIER_COLORS: Record<string, string> = {
  '优秀候选人': 'text-green-400 bg-green-400/10 border-green-400/30',
  '合格候选人': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  '初级候选人': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  '不匹配': 'text-red-400 bg-red-400/10 border-red-400/30',
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#60a5fa' : '#facc15'

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="-mt-[76px] text-center">
        <div className="text-4xl font-bold">{score}</div>
        <div className="text-xs text-gray-400 mt-1">匹配分</div>
      </div>
    </div>
  )
}

export default function ResultView({
  result,
  createdAt,
}: {
  result: AnalysisResult
  createdAt: string
}) {
  const tierColor = TIER_COLORS[result.tier.level] || 'text-gray-400 bg-gray-800 border-gray-600'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">分析结果</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date(createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 评分 + 档次 */}
      <div className="bg-gray-900 rounded-2xl p-6 flex items-center gap-8">
        <ScoreRing score={result.score} />
        <div className="flex-1">
          <span className={`inline-block px-3 py-1 rounded-full border text-sm font-medium ${tierColor}`}>
            {result.tier.level}
          </span>
          <p className="text-gray-300 text-sm mt-3">{result.tier.description}</p>
          <p className="text-gray-400 text-sm mt-2">{result.summary}</p>
        </div>
      </div>

      {/* 匹配项 */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle size={18} className="text-green-400" />
          匹配项
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {result.matched.skills.map(skill => (
            <span key={skill} className="bg-green-400/10 text-green-300 text-xs px-3 py-1 rounded-full border border-green-400/20">
              {skill}
            </span>
          ))}
        </div>
        <ul className="space-y-1">
          {result.matched.highlights.map((h, i) => (
            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>{h}
            </li>
          ))}
        </ul>
      </div>

      {/* 缺失项 */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <XCircle size={18} className="text-red-400" />
          待补强
        </h2>
        {result.missing.hard_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {result.missing.hard_skills.map(skill => (
              <span key={skill} className="bg-red-400/10 text-red-300 text-xs px-3 py-1 rounded-full border border-red-400/20">
                {skill}
              </span>
            ))}
          </div>
        )}
        <ul className="space-y-1">
          {result.missing.experience.map((e, i) => (
            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-red-400 mt-0.5">✗</span>{e}
            </li>
          ))}
        </ul>
      </div>

      {/* 改进建议 */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-400" />
          改进建议
        </h2>
        <div className="space-y-4">
          {result.suggestions.map((s, i) => (
            <div key={i} className="border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-yellow-400 font-medium mb-1">{s.section}</div>
              <p className="text-gray-400 text-sm mb-2">{s.issue}</p>
              <p className="text-gray-200 text-sm bg-gray-800 rounded-lg px-3 py-2">{s.rewrite}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
