export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { analyzeJDStream } from '@/lib/jd-analysis'

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
  const { jdText } = body ?? {}

  if (!jdText?.trim()) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '请输入岗位描述' })}\n\n`),
      { status: 400, headers: sseHeaders() }
    )
  }

  const stream = await analyzeJDStream(jdText)
  return new Response(stream, { headers: sseHeaders() })
}
