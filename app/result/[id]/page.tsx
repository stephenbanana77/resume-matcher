import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ResultView from '@/components/ResultView'

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
      <main className="max-w-3xl mx-auto px-4 py-10">
        <ResultView result={data.result} createdAt={data.created_at} />
      </main>
    </div>
  )
}
