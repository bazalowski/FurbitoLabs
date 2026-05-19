import { redirect } from 'next/navigation'

interface RankingRedirectProps {
  params: { cid: string }
}

export default function RankingRedirect({ params }: RankingRedirectProps) {
  redirect(`/${params.cid}/jugadores`)
}
