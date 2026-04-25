export interface JDAnalysisResult {
  role: {
    title: string
    level: string
    domain: string
  }
  must_have: {
    skills: string[]
    experience: string[]
  }
  nice_to_have: {
    skills: string[]
    experience: string[]
  }
  responsibilities: string[]
  growth_path: {
    short_term: string[]
    long_term: string[]
  }
  summary: string
}

const PROMPT = (jdText: string) => `你是一位资深职业规划师和技术面试官。请深度解读以下岗位描述，帮助求职者理解这个岗位的真实要求和成长路径。

## 岗位描述
${jdText}

请严格按以下 JSON 格式返回，不要包含任何其他文字：

{
  "role": {
    "title": "<从 JD 推断的标准岗位名称>",
    "level": "<岗位级别：初级 / 中级 / 高级 / 资深 / 专家 / 管理层>",
    "domain": "<所属领域，如：前端开发 / 后端开发 / 产品经理 / 数据分析 等>"
  },
  "must_have": {
    "skills": ["<必备技术技能或工具，按重要程度排序>"],
    "experience": ["<必须具备的工作经历或项目经验>"]
  },
  "nice_to_have": {
    "skills": ["<加分技能，有更好但不硬性要求>"],
    "experience": ["<加分经历>"]
  },
  "responsibilities": ["<核心工作职责，用动词开头，最多 5 条>"],
  "growth_path": {
    "short_term": ["<3-6 个月内应重点补强的具体技能或经验，给出学习建议>"],
    "long_term": ["<该岗位通向的职业发展方向，以及进阶所需能力>"]
  },
  "summary": "<对这个岗位的整体评价：门槛难度、市场竞争情况、最值得关注的要求，100字以内>"
}`

export async function analyzeJDStream(jdText: string): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: PROMPT(jdText) }],
      stream: true,
      temperature: 0.3,
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

        const result = JSON.parse(accumulated) as JDAnalysisResult
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
