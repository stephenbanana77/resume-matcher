export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf'
import { analyzeResume } from '@/lib/deepseek'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('resume') as File | null
    const jdText = formData.get('jd') as string | null

    if (!file || !jdText?.trim()) {
      return NextResponse.json({ error: '请上传简历并填写JD' }, { status: 400 })
    }

    console.log('[analyze] 开始解析 PDF')
    const buffer = Buffer.from(await file.arrayBuffer())
    const resumeText = await extractTextFromPDF(buffer)
    console.log('[analyze] PDF 解析完成，字符数:', resumeText.length)

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'PDF 内容为空，请检查文件' }, { status: 400 })
    }

    console.log('[analyze] 开始调用 DeepSeek')
    const result = await analyzeResume(resumeText, jdText)
    console.log('[analyze] DeepSeek 返回成功')

    const { data, error } = await supabase
      .from('analyses')
      .insert({ user_id: user.id, resume_text: resumeText, jd_text: jdText, result })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: '保存失败: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[analyze] 错误:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
