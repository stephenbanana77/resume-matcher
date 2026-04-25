export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { extractTextFromPDF } from '@/lib/pdf'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { data, error } = await supabase
    .from('resumes')
    .select('id, filename, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('resume') as File | null
  if (!file) return NextResponse.json({ error: '请上传文件' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const resumeText = await extractTextFromPDF(buffer)

  if (!resumeText.trim()) {
    return NextResponse.json({ error: 'PDF 内容为空' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: user.id, filename: file.name, resume_text: resumeText })
    .select('id, filename, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
