import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, company, position, status, applied_at, notes, created_at,
      analysis_id,
      analyses ( result )
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { company, position, analysisId, notes } = body ?? {}

  if (!company?.trim() || !position?.trim()) {
    return NextResponse.json({ error: '公司和岗位不能为空' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company: company.trim(),
      position: position.trim(),
      analysis_id: analysisId ?? null,
      notes: notes?.trim() ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { id, status, notes } = body ?? {}

  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (status) updates.status = status
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
