'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleBanner } from '@/components/layout/RoleBanner'
import { ToastProvider } from '@/components/ui/Toast'

interface CommunityLayoutProps {
  children: React.ReactNode
  params: { cid: string }
}

export default function CommunityLayout({ children, params }: CommunityLayoutProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { player } = usePlayer(session.playerId)

  // Redirect to login if no active community in session
  useEffect(() => {
    if (!session.communityId || session.communityId !== cid) {
      router.replace('/')
    }
  }, [session.communityId, cid, router])

  // Apply community color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--comm-color', session.communityColor)
    return () => {
      document.documentElement.style.setProperty('--comm-color', '#a8ff3e')
    }
  }, [session.communityColor])

  if (!session.communityId) return null

  return (
    <div className="max-w-app mx-auto min-h-screen relative flex flex-col">
      <RoleBanner role={session.role} playerName={player?.name} />
      <main className="flex-1 pb-nav view-enter">
        {children}
      </main>
      <BottomNav communityId={session.communityId} communityColor={session.communityColor} />
      <ToastProvider />
    </div>
  )
}
