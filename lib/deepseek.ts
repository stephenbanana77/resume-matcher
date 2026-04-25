export interface AnalysisResult {
  score: number
  tier: {
    level: string
    description: string
  }
  matched: {
    skills: string[]
    highlights: string[]
  }
  missing: {
    hard_skills: string[]
    experience: string[]
  }
  suggestions: {
    section: string
    issue: string
    rewrite: string
  }[]
  summary: string
}

const PROMPT = (resumeText: string, jdText: string) => `你是一位资深 HR 和技术面试官。请分析以下简历与岗位描述的匹配程度。

## 简历内容
${resumeText}

## 岗位描述 (JD)
${jdText}

请严格按照以下 JSON 格式返回分析结果，不要包含任何其他文字：

{
  "score": <0-100的整数，表示综合匹配度>,
  "tier": {
    "level": "<候选人档次：优秀候选人 / 合格候选人 / 初级候选人 / 不匹配>",
    "description": "<一句话说明该档次的原因>"
  },
  "matched": {
    "skills": ["<匹配的技术技能列表>"],
    "highlights": ["<简历中符合JD要求的亮点，最多3条>"]
  },
  "missing": {
    "hard_skills": ["<缺失的技术技能列表>"],
    "experience": ["<缺失的经验要求列表>"]
  },
  "suggestions": [
    {
      "section": "<需要改进的简历模块，如：项目经历、技能栈、自我介绍>",
      "issue": "<该模块存在的问题>",
      "rewrite": "<具体的改写建议或示例>"
    }
  ],
  "summary": "<100字以内的整体评价，包括当前匹配情况和最关键的提升方向>"
}`

export async function analyzeResumeStream(
  resumeText: string,
  jdText: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: PROMPT(resumeText, jdText) }],
      stream: true,
      temperature: 0.3,
    }),
  })

  if (!deepseekRes.ok) {
    throw new Error(`DeepSeek API error: ${deepseekRes.status}`)
  }

  const reader = deepseekRes.body!.getReader()
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

        const result = JSON.parse(accumulated) as AnalysisResult
        send({ type: 'done', result })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        send({ type: 'error', message: msg })
      } finally {
        controller.close()
      }
    },
  })
}
