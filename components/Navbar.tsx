'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link href="/analyze" className="font-semibold text-white">
        简历匹配分析
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/analyze" className="text-gray-300 hover:text-white transition-colors">
          新分析
        </Link>
        <Link href="/history" className="text-gray-300 hover:text-white transition-colors">
          历史记录
        </Link>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white transition-colors"
        >
          退出
        </button>
      </div>
    </nav>
  )
}
