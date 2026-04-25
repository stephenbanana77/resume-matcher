export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateInterviewPrepStream } from '@/lib/interview'
import { AnalysisResult } from '@/lib/deepseek'

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
  const { analysisId, context } = body ?? {}

  if (!analysisId) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '参数不完整' })}\n\n`),
      { status: 400, headers: sseHeaders() }
    )
  }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('result, jd_text')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (!analysis) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '分析记录不存在' })}\n\n`),
      { status: 404, headers: sseHeaders() }
    )
  }

  const stream = await generateInterviewPrepStream(
    analysis.result as AnalysisResult,
    analysis.jd_text,
    context?.trim() || undefined
  )

  return new Response(stream, { headers: sseHeaders() })
}
