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

export async function analyzeResume(
  resumeText: string,
  jdText: string
): Promise<AnalysisResult> {
  const prompt = `你是一位资深 HR 和技术面试官。请分析以下简历与岗位描述的匹配程度。

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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  let response: Response
  try {
    response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: controller.signal,
    })
  } catch (e) {
    throw new Error('DeepSeek API 连接超时，请检查网络或稍后重试')
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  return JSON.parse(content) as AnalysisResult
}
