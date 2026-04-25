export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { analyzeResumeStream } from '@/lib/deepseek'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const encoder = new TextEncoder()

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '未登录' })}\n\n`),
      { status: 401, headers: sseHeaders() }
    )
  }

  const body = await req.json().catch(() => null)
  const { resumeId, jdText } = body ?? {}

  if (!resumeId || !jdText?.trim()) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '参数不完整' })}\n\n`),
      { status: 400, headers: sseHeaders() }
    )
  }

  const { data: resume } = await supabase
    .from('resumes')
    .select('resume_text')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single()

  if (!resume) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '简历不存在' })}\n\n`),
      { status: 404, headers: sseHeaders() }
    )
  }

  const deepseekStream = await analyzeResumeStream(resume.resume_text, jdText)
  const reader = deepseekStream.getReader()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let result = null
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = new TextDecoder().decode(value)
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const parsed = JSON.parse(line.slice(6))

            if (parsed.type === 'done') {
              result = parsed.result
            } else {
              controller.enqueue(value)
            }
          }
        }

        if (result) {
          const { data, error } = await supabase
            .from('analyses')
            .insert({
              user_id: user.id,
              resume_text: resume.resume_text,
              jd_text: jdText,
              result,
            })
            .select('id')
            .single()

          if (error) throw new Error('保存失败: ' + error.message)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', id: data.id })}\n\n`)
          )
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  }
}
