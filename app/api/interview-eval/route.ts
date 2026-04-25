export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { evaluateAnswerStream } from '@/lib/interview-eval'

const encoder = new TextEncoder()

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  }
}

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
  const { question, approach, answer } = body ?? {}

  if (!question || !approach || !answer?.trim()) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '参数不完整' })}\n\n`),
      { status: 400, headers: sseHeaders() }
    )
  }

  const stream = await evaluateAnswerStream(question, approach, answer)
  return new Response(stream, { headers: sseHeaders() })
}
