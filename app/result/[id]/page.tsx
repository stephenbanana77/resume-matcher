import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ResultView from '@/components/ResultView'
import { BrainCircuit } from 'lucide-react'

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data } = await supabase
    .from('analyses')
    .select('result, jd_text, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) notFound()

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <ResultView result={data.result} createdAt={data.created_at} />
        <Link
          href={`/interview/${id}`}
          className="flex items-center justify-center gap-2 w-full border border-gray-700 hover:border-blue-500 hover:text-blue-400 text-gray-300 rounded-xl py-3 text-sm font-medium transition-colors"
        >
          <BrainCircuit size={16} />
          生成面试题预测
        </Link>
      </main>
    </div>
  )
}
