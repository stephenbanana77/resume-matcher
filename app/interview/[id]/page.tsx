import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import InterviewPrep from '@/components/InterviewPrep'
import { ArrowLeft } from 'lucide-react'

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data } = await supabase
    .from('analyses')
    .select('jd_text, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()

  const jdPreview = data.jd_text.slice(0, 60).replace(/\n/g, ' ')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <Link
            href={`/result/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            返回分析结果
          </Link>
          <h1 className="text-2xl font-bold">面试题预测</h1>
          <p className="text-gray-500 text-sm mt-1 truncate">{jdPreview}...</p>
        </div>
        <InterviewPrep analysisId={id} />
      </main>
    </div>
  )
}
