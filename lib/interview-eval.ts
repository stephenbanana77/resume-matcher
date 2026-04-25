export interface AnswerEvaluation {
  rating: '优秀' | '良好' | '一般' | '需改进'
  strengths: string[]
  missing: string[]
  suggestion: string
}

const PROMPT = (question: string, approach: string, answer: string) => `你是一位严格但公正的面试官，正在评价候选人的口头回答。

## 面试题
${question}

## 参考回答要点
${approach}

## 候选人的回答
${answer}

请评价候选人回答的质量。评分标准：
- 优秀：覆盖了核心要点，逻辑清晰，有具体例子
- 良好：覆盖主要要点，但细节或结构有欠缺
- 一般：只触及表面，缺少关键内容
- 需改进：回答偏题或严重遗漏核心要点

请严格按以下 JSON 格式返回，不要包含任何其他文字：

{
  "rating": "<优秀 | 良好 | 一般 | 需改进>",
  "strengths": ["<回答中值得肯定的点，最多 2 条，没有则返回空数组>"],
  "missing": ["<遗漏的关键要点，最多 2 条，没有则返回空数组>"],
  "suggestion": "<一句话具体改进建议>"
}`

export async function evaluateAnswerStream(
  question: string,
  approach: string,
  answer: string
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
      messages: [{ role: 'user', content: PROMPT(question, approach, answer) }],
      stream: true,
      temperature: 0.2,
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
                send({ type: 'chunk' })
              }
            } catch {}
          }
        }

        const evaluation = JSON.parse(accumulated) as AnswerEvaluation
        send({ type: 'done', evaluation })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        send({ type: 'error', message: msg })
      } finally {
        controller.close()
      }
    },
  })
}
