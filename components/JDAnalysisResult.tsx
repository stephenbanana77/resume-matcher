'use client'

import { JDAnalysisResult } from '@/lib/jd-analysis'
import { CheckCircle, Star, Briefcase, TrendingUp, Info } from 'lucide-react'

const LEVEL_COLORS: Record<string, string> = {
  '初级': 'text-green-400 bg-green-400/10 border-green-400/30',
  '中级': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  '高级': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  '资深': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  '专家': 'text-red-400 bg-red-400/10 border-red-400/30',
  '管理层': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
}

function Tag({ label, variant = 'default' }: { label: string; variant?: 'green' | 'blue' | 'gray' | 'default' }) {
  const styles = {
    green: 'bg-green-400/10 text-green-300 border-green-400/20',
    blue: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
    gray: 'bg-gray-700/50 text-gray-300 border-gray-600/40',
    default: 'bg-gray-800 text-gray-300 border-gray-700',
  }
  return (
    <span className={`text-xs px-3 py-1 rounded-full border ${styles[variant]}`}>
      {label}
    </span>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function JDAnalysisResult({ result }: { result: JDAnalysisResult }) {
  const levelColor = LEVEL_COLORS[result.role.level] || 'text-gray-400 bg-gray-800 border-gray-600'

  return (
    <div className="space-y-4">
      {/* 岗位基本信息 */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">{result.role.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{result.role.domain}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full border font-medium ${levelColor}`}>
            {result.role.level}
          </span>
        </div>
        <p className="text-gray-300 text-sm mt-4 leading-relaxed">{result.summary}</p>
      </div>

      {/* 必备要求 */}
      <Section icon={<CheckCircle size={18} className="text-green-400" />} title="必须具备">
        <div className="space-y-4">
          {result.must_have.skills.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">技术技能</p>
              <div className="flex flex-wrap gap-2">
                {result.must_have.skills.map(s => (
                  <Tag key={s} label={s} variant="green" />
                ))}
              </div>
            </div>
          )}
          {result.must_have.experience.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">工作经验</p>
              <ul className="space-y-1.5">
                {result.must_have.experience.map((e, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>{e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* 加分项 */}
      {(result.nice_to_have.skills.length > 0 || result.nice_to_have.experience.length > 0) && (
        <Section icon={<Star size={18} className="text-yellow-400" />} title="加分项">
          <div className="space-y-4">
            {result.nice_to_have.skills.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">技能加分</p>
                <div className="flex flex-wrap gap-2">
                  {result.nice_to_have.skills.map(s => (
                    <Tag key={s} label={s} variant="blue" />
                  ))}
                </div>
              </div>
            )}
            {result.nice_to_have.experience.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">经历加分</p>
                <ul className="space-y-1.5">
                  {result.nice_to_have.experience.map((e, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5 shrink-0">+</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 核心职责 */}
      {result.responsibilities.length > 0 && (
        <Section icon={<Briefcase size={18} className="text-blue-400" />} title="核心职责">
          <ul className="space-y-2">
            {result.responsibilities.map((r, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                <span className="text-blue-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 成长路径 */}
      <Section icon={<TrendingUp size={18} className="text-purple-400" />} title="成长路径">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <p className="text-xs text-purple-400 font-medium">近期重点（3-6 个月）</p>
            </div>
            <ul className="space-y-2 pl-4 border-l border-purple-400/20">
              {result.growth_path.short_term.map((item, i) => (
                <li key={i} className="text-sm text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <p className="text-xs text-gray-400 font-medium">长远发展方向</p>
            </div>
            <ul className="space-y-2 pl-4 border-l border-gray-600/30">
              {result.growth_path.long_term.map((item, i) => (
                <li key={i} className="text-sm text-gray-400">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 跳转提示 */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-300">
          已有简历？去{' '}
          <a href="/analyze" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            匹配分析
          </a>
          {' '}看看你与这个岗位的差距。
        </p>
      </div>
    </div>
  )
}
