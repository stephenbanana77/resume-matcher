import { AnalysisResult } from './deepseek'

export interface InterviewQuestion {
  type: '技术考察' | '项目追问' | '差距应对' | '行为问题'
  question: string
  why: string
  approach: string
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[]
  tips: string
}

const PROMPT = (result: AnalysisResult, jdText: string, context?: string) => `你是一位资深面试官。根据以下候选人的简历匹配分析结果和岗位描述，生成一份针对性的面试题预测清单。
${context ? `\n## 面试背景\n${context}\n请根据此背景调整题目难度、考察侧重点和风格。\n` : ''}
## 岗位描述
${jdText}

## 匹配分析结果
- 综合得分：${result.score} / 100
- 候选人档次：${result.tier.level}
- 已匹配技能：${result.matched.skills.join('、')}
- 简历亮点：${result.matched.highlights.join('；')}
- 缺失技术技能：${result.missing.hard_skills.join('、') || '无'}
- 缺失经验：${result.missing.experience.join('；') || '无'}

请生成 8 道面试题，覆盖以下 4 类（每类 2 道）：
1. **技术考察**：针对候选人声称掌握的技能，考察掌握深度
2. **项目追问**：针对简历亮点，深挖细节和贡献
3. **差距应对**：针对缺失技能/经验，预测面试官会如何追问
4. **行为问题**：针对该岗位常见的 STAR 行为面试题

请严格按以下 JSON 格式返回，不要包含任何其他文字：

{
  "questions": [
    {
      "type": "<技术考察 | 项目追问 | 差距应对 | 行为问题>",
      "question": "<面试题原文>",
      "why": "<为什么会被问这道题，关联你的简历或缺口>",
      "approach": "<建议回答思路，包含关键点和注意事项>"
    }
  ],
  "tips": "<针对本次面试的 2-3 条整体准备建议，50字以内>"
}`

export async function generateInterviewPrepStream(
  result: AnalysisResult,
  jdText: string,
  context?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: PROMPT(result, jdText, context) }],
      stream: true,
      temperature: 0.4,
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const raw = trimmed.slice(6)
            if (raw === '[DONE]') continue
            try {
              const parsed = JSON.parse(raw)
              const content: string = parsed.choices?.[0]?.delta?.content ?? ''
              if (content) {
                accumulated += content
                send({ type: 'chunk', content })
              }
            } catch {}
          }
        }

        const prepResult = JSON.parse(accumulated) as InterviewPrepResult
        send({ type: 'done', result: prepResult })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        send({ type: 'error', message: msg })
      } finally {
        controller.close()
      }
    },
  })
}
