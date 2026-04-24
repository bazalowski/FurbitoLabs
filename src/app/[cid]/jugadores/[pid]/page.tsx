'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { useVotes } from '@/hooks/useVotes'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BadgeShowcase } from '@/components/ui/Badge'
import { BadgeVitrina } from '@/components/players/BadgeVitrina'
import { PlayerTimeline } from '@/components/players/PlayerTimeline'
import { PointsEvolutionChart } from '@/components/players/PointsEvolutionChart'
import { getLevel, getNextLevel, xpPercent } from '@/lib/game/levels'
import { getPlayerRating, SKILLS } from '@/lib/game/scoring'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { Avatar, isAvatarUrl } from '@/components/ui/Avatar'
import { uploadPlayerAvatar, deletePlayerAvatar } from '@/lib/supabase/avatars'
import { openPinModal } from '@/lib/utils'
import Link from 'next/link'

interface PlayerProfilePageProps {
  params: { cid: string; pid: string }
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { cid, pid } = params
  const router = useRouter()
  const session = useSession()
  const { player, loading } = usePlayer(pid)
  const { community } = useCommunity(cid)
  const { votes, reload: reloadVotes } = useVotes(cid)
  const adminIds = community?.admin_ids ?? []
  const isProfileAdmin = player ? adminIds.includes(player.id) : false

  const [rating, setRating] = useState<Record<string, number>>({})
  const [voting, setVoting] = useState(false)
  const [voteOpen, setVoteOpen] = useState(false)

  // Change PIN state
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSaving, setPinSaving] = useState(false)

  // Change name state
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  // Change photo state
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoSaving, setPhotoSaving] = useState(false)

  const myPlayer = session.playerId
  const isOwnProfile = myPlayer === pid
  const canVote = myPlayer && myPlayer !== pid
  const existingVote = votes.find(v => v.voter_id === myPlayer && v.voted_id === pid)
  const playerRating = player ? getPlayerRating(pid, votes) : null

  const level = player ? getLevel(player.xp) : null
  const nextLevel = player ? getNextLevel(player.xp) : null
  const pct = player ? xpPercent(player.xp) : 0
  const communityColor = session.communityColor

  async function submitVote() {
    if (!myPlayer || !player) return
    if (existingVote) { showToast('Ya has valorado a este jugador'); setVoteOpen(false); return }
    const allFilled = SKILLS.every(s => rating[s.key] >= 1 && rating[s.key] <= 5)
    if (!allFilled) { showToast('Puntúa todas las habilidades'); return }

    setVoting(true)
    const supabase = createClient()
    const payload = { community_id: cid, voter_id: myPlayer, voted_id: pid, ...rating }
    await supabase.from('votes').insert(payload)

    showToast('✅ Valoración guardada')
    setVoteOpen(false)
    reloadVotes()
    setVoting(false)
  }

  async function handleNameChange() {
    const trimmed = newName.trim()
    if (trimmed.length < 2) { setNameError('El nombre debe tener al menos 2 caracteres'); return }
    if (trimmed.length > 40) { setNameError('Máximo 40 caracteres'); return }
    if (player && trimmed === player.name) { setNameError('El nuevo nombre debe ser diferente'); return }

    setNameSaving(true)
    setNameError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('players').update({ name: trimmed }).eq('id', pid)
      if (error) { setNameError('Error al actualizar el nombre'); setNameSaving(false); return }
      showToast('Nombre actualizado')
      setNameModalOpen(false)
      setNewName('')
      setNameError('')
    } catch {
      setNameError('Error de conexión')
    } finally {
      setNameSaving(false)
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith('image/')) { setPhotoError('Selecciona una imagen'); return }
    if (file.size > 10 * 1024 * 1024) { setPhotoError('Imagen demasiado grande (máx 10 MB)'); return }

    setPhotoSaving(true); setPhotoError('')
    try {
      await uploadPlayerAvatar(cid, pid, file)
      showToast('Foto actualizada')
      setPhotoModalOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir la foto'
      setPhotoError(msg)
    } finally {
      setPhotoSaving(false)
    }
  }

  async function handlePhotoRemove() {
    setPhotoSaving(true); setPhotoError('')
    try {
      await deletePlayerAvatar(cid, pid)
      showToast('Foto eliminada')
      setPhotoModalOpen(false)
    } catch {
      setPhotoError('No se pudo eliminar la foto')
    } finally {
      setPhotoSaving(false)
    }
  }

  async function handlePinChange() {
    if (!/^\d{4}$/.test(currentPin)) { setPinError('El PIN actual debe tener 4 dígitos'); return }
    if (!/^\d{4}$/.test(newPin)) { setPinError('El nuevo PIN debe tener 4 dígitos'); return }
    if (currentPin === newPin) { setPinError('El nuevo PIN debe ser diferente al actual'); return }

    setPinSaving(true)
    setPinError('')

    try {
      const supabase = createClient()
      const { data: check, error: checkErr } = await supabase
        .from('players').select('id').eq('id', pid).eq('code', currentPin).single()

      if (checkErr || !check) { setPinError('El PIN actual no es correcto'); setPinSaving(false); return }

      const { error: updateErr } = await supabase.from('players').update({ code: newPin }).eq('id', pid)
      if (updateErr) { setPinError('Error al actualizar el PIN'); setPinSaving(false); return }

      showToast('PIN actualizado correctamente')
      setPinModalOpen(false)
      setCurrentPin(''); setNewPin(''); setPinError('')
    } catch {
      setPinError('Error de conexión')
    } finally {
      setPinSaving(false)
    }
  }

  if (loading) return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  if (!player) return <div className="p-4" style={{ color: 'var(--muted)' }}>Jugador no encontrado</div>

  // Skill bars data — always visible (0 if no votes)
  const skillBars = SKILLS.map(sk => {
    const bySkill = playerRating?.bySkill.find(s => s.key === sk.key)
    return {
      ...sk,
      avg: bySkill?.avg ?? 0,
      pct: bySkill ? ((bySkill.avg - 1) / 4) * 100 : 0,
    }
  })

  return (
    <div className="view-enter">
      <Header
        title=""
        left={
          <button onClick={() => router.back()} style={{ color: 'var(--muted)' }}>
            ← {player.name}
          </button>
        }
      />

      <div className="px-4 space-y-4 pt-2 pb-28" style={{ ['--comm-color' as string]: communityColor }}>

        {/* ── Hero header — arena: portada deportiva ───── */}
        <div className="surface-arena p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ ['--aura-color' as string]: isProfileAdmin ? 'var(--gold)' : communityColor }}>
              <span aria-hidden="true" className="aura-halo" style={{ inset: '-14%' }} />
              <Avatar
                name={player.name}
                avatar={player.avatar}
                size={80}
                fontSize={28}
                communityColor={communityColor}
                borderColor={isProfileAdmin ? 'var(--gold)' : communityColor + '66'}
                borderWidth={3}
              />
              {isOwnProfile && (
                <button
                  onClick={() => setPhotoModalOpen(true)}
                  aria-label="Cambiar foto"
                  className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs active:scale-95 transition-transform"
                  style={{
                    background: communityColor,
                    color: '#000',
                    border: '2px solid var(--bg)',
                    boxShadow: 'var(--shadow-depth-1)',
                  }}
                >
                  📷
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bebas text-4xl leading-none tracking-display truncate" style={{ maxWidth: '100%' }}>
                  {player.name}
                </h1>
                {isProfileAdmin && (
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold)', border: '1px solid rgba(255,215,0,0.35)' }}
                  >
                    Admin
                  </span>
                )}
              </div>
              {player.position && (
                <p className="font-mono text-[11px] capitalize mt-1" style={{ color: 'var(--muted)' }}>
                  {player.position}
                </p>
              )}
              <p className="font-mono text-[11px] mt-1.5" style={{ color: communityColor }}>
                <span aria-hidden="true">{level?.icon}</span>{' '}
                <span className="font-barlow font-bold">Nv.{level?.level}</span>{' '}
                <span style={{ color: 'var(--muted)' }}>{level?.name}</span>
                <span className="divider-dot" aria-hidden="true" />
                <span>{player.xp} XP</span>
              </p>
            </div>
          </div>

          <div className="xp-bar mt-3">
            <div className="xp-bar-fill" style={{ width: `${pct}%`, background: communityColor }} />
          </div>
          {nextLevel && (
            <p className="font-mono text-[10px] mt-1.5" style={{ color: 'var(--muted)' }}>
              Siguiente: <span style={{ color: 'var(--text)' }}>{nextLevel.name}</span>
              <span className="divider-dot" aria-hidden="true" />
              {nextLevel.min - player.xp} XP restantes
            </p>
          )}
        </div>

        {/* ── Expositor de insignias (5 slots editable by owner) ── */}
        <BadgeVitrina
          playerId={player.id}
          vitrina={player.vitrina}
          unlocked={player.badges}
          accentColor={communityColor}
          editable={isOwnProfile}
        />

        {/* ── Stats: fila horizontal 5 chips con fade edges ───────── */}
        <div className="relative -mx-4">
          <div className="px-4 flex gap-2 overflow-x-auto pb-1 snap-x scroll-px-4">
            {[
              { label: 'Partidos',    value: player.partidos,       icon: '🗓️' },
              { label: 'Goles',       value: player.goles,          icon: '⚽' },
              { label: 'Asistencias', value: player.asistencias,    icon: '🎯' },
              { label: 'MVPs',        value: player.mvps,           icon: '👑' },
              { label: 'Badges',      value: player.badges.length,  icon: '🏅' },
            ].map(s => (
              <div
                key={s.label}
                className="surface-calm flex-shrink-0 snap-start p-3 text-center min-w-[76px]"
              >
                <p className="text-base leading-none mb-1" aria-hidden="true">{s.icon}</p>
                <p
                  className="font-bebas text-2xl leading-none tabular-nums tracking-display"
                  style={{ color: communityColor }}
                >
                  {s.value}
                </p>
                <p
                  className="font-barlow text-[10px] font-bold uppercase tracking-widest mt-1 leading-tight"
                  style={{ color: 'var(--muted)' }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          {/* Fade edges — pista visual de que hay más a la derecha */}
          <div
            className="pointer-events-none absolute top-0 bottom-1 left-0 w-4"
            style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 bottom-1 right-0 w-8"
            style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }}
            aria-hidden="true"
          />
        </div>

        {/* ── Skill bars (siempre visibles) ─────────── */}
        <div className="surface-calm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-barlow text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Habilidades
            </p>
            {playerRating ? (
              <p className="font-bebas text-xl leading-none tracking-display tabular-nums" style={{ color: communityColor }}>
                ★ {playerRating.avg.toFixed(1)}
                <span className="font-mono text-[10px] ml-1.5" style={{ color: 'var(--muted)' }}>
                  ({playerRating.count} votos)
                </span>
              </p>
            ) : (
              <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>Sin valoraciones</p>
            )}
          </div>
          <div className="space-y-2.5">
            {skillBars.map(sk => (
              <div key={sk.key} className="flex items-center gap-2">
                <span className="text-sm w-5 flex-shrink-0" aria-hidden="true">{sk.icon}</span>
                <span className="font-barlow text-[10px] font-bold uppercase tracking-widest w-20 flex-shrink-0" style={{ color: 'var(--muted)' }}>
                  {sk.label}
                </span>
                <div className="flex-1 xp-bar">
                  <div
                    className="xp-bar-fill transition-all"
                    style={{ width: `${sk.pct}%`, background: communityColor, opacity: sk.pct === 0 ? 0.25 : 1 }}
                  />
                </div>
                <span
                  className="font-mono text-[11px] font-bold w-9 text-right tabular-nums"
                  style={{ color: sk.pct > 0 ? communityColor : 'var(--muted)' }}
                >
                  {sk.avg > 0 ? sk.avg.toFixed(1) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gráfica: evolución de puntos por partido ── */}
        <PointsEvolutionChart
          playerId={pid}
          communityId={cid}
          communityColor={communityColor}
        />

        {/* Catálogo completo (collapsible) — muestra todas, marcando las desbloqueadas */}
        <BadgeShowcase unlockedKeys={player.badges} accentColor={communityColor} />

        {/* ── Historial de partidos ─────────────────── */}
        <div>
          <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)' }}>
            Historial
          </p>
          <PlayerTimeline
            playerId={pid}
            communityId={cid}
            communityColor={communityColor}
          />
        </div>

        {/* ── CTA Valorar ───────────────────────────── */}
        {!isOwnProfile && (
          <Button
            variant="primary"
            className="w-full"
            disabled={!!(canVote && existingVote)}
            onClick={() => {
              if (!canVote) { openPinModal(); return }
              if (existingVote) { showToast('Ya has valorado a este jugador'); return }
              setVoteOpen(true)
            }}
          >
            {canVote
              ? (existingVote ? '✓ Ya valorado' : '⭐ Valorar jugador')
              : '🔑 Acceder para valorar'}
          </Button>
        )}

        {/* ── Admin: PIN de jugador ─────────────────── */}
        {session.role === 'admin' && (
          <div className="surface-calm p-4">
            <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>
              PIN de jugador
            </p>
            <p
              className="font-mono text-3xl font-bold tabular-nums"
              style={{ color: communityColor, letterSpacing: '0.3em' }}
            >
              {player.code}
            </p>
            <p className="font-mono text-[10px] mt-2" style={{ color: 'var(--muted)' }}>
              Comparte este PIN con el jugador para que pueda identificarse
            </p>
          </div>
        )}

        {/* ── Acciones de perfil propio ─────────────── */}
        {isOwnProfile && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => { setNewName(player.name); setNameModalOpen(true) }}
                style={{ minHeight: 48 }}
              >
                ✏️ Cambiar nombre
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => setPinModalOpen(true)}
                style={{ minHeight: 48 }}
              >
                🔑 Cambiar PIN
              </Button>
            </div>
            <Link
              href={`/${cid}/ayuda`}
              className="w-full flex items-center justify-center rounded-m font-bold text-sm uppercase tracking-widest active:scale-[0.98] transition-transform select-none"
              style={{
                minHeight: 48,
                background: communityColor + '15',
                color: communityColor,
                border: `1px solid ${communityColor}55`,
              }}
            >
              🎓 Ver tutorial
            </Link>
          </div>
        )}

      </div>

      {/* ── Modal: Valorar ────────────────────────────── */}
      <Modal
        open={voteOpen && !!canVote && !existingVote}
        onClose={() => { if (!voting) setVoteOpen(false) }}
        title={`⭐ Valorar a ${player.name}`}
        footer={
          <Button
            variant="primary"
            className="w-full"
            onClick={submitVote}
            disabled={voting}
          >
            {voting ? 'Guardando...' : '✅ Enviar valoración'}
          </Button>
        }
      >
        <p className="font-mono text-[11px] mb-2" style={{ color: 'var(--muted)' }}>Puntúa del 1 al 5 cada habilidad</p>
        <p className="text-[11px] mb-4" style={{ color: 'var(--muted)', opacity: 0.8 }}>
          Solo puedes valorar una vez. No podrás cambiarlo después.
        </p>

        <div className="space-y-3">
          {SKILLS.map(skill => (
            <div key={skill.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold">
                  <span aria-hidden="true">{skill.icon}</span> {skill.label}
                </span>
                <span className="font-bebas text-base tabular-nums" style={{ color: communityColor }}>
                  {rating[skill.key] ?? '—'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={() => setRating(r => ({ ...r, [skill.key]: v }))}
                    className="flex-1 py-2.5 rounded-s text-sm font-bold transition-all active:scale-95 select-none"
                    style={{
                      minHeight: 44,
                      background: (rating[skill.key] ?? 0) >= v ? communityColor : 'var(--card)',
                      color: (rating[skill.key] ?? 0) >= v ? '#050d05' : 'var(--muted)',
                      border: `1px solid ${(rating[skill.key] ?? 0) >= v ? communityColor : 'var(--border)'}`,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Modal: Cambiar PIN ────────────────────────── */}
      <Modal
        open={pinModalOpen}
        onClose={() => {
          if (pinSaving) return
          setPinModalOpen(false); setCurrentPin(''); setNewPin(''); setPinError('')
        }}
        title="🔑 Cambiar PIN"
        footer={
          <Button
            variant="primary"
            className="w-full"
            onClick={handlePinChange}
            disabled={pinSaving || currentPin.length !== 4 || newPin.length !== 4}
          >
            {pinSaving ? 'Guardando...' : 'Confirmar cambio'}
          </Button>
        }
      >
        <div className="space-y-3">
          {(['PIN actual', 'Nuevo PIN'] as const).map((labelText, i) => {
            const val = i === 0 ? currentPin : newPin
            const setter = i === 0 ? setCurrentPin : setNewPin
            return (
              <Input
                key={labelText}
                label={labelText}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={val}
                onChange={(e) => { setter(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
                placeholder="0000"
                data-autofocus={i === 0 ? true : undefined}
                className="text-center font-mono text-2xl tracking-[0.4em]"
                style={{
                  borderColor: pinError ? 'var(--red)' : undefined,
                }}
              />
            )
          })}
          {pinError && (
            <p className="font-mono text-[11px] text-center" style={{ color: 'var(--red)' }}>{pinError}</p>
          )}
        </div>
      </Modal>

      {/* ── Modal: Cambiar nombre ─────────────────────── */}
      <Modal
        open={nameModalOpen}
        onClose={() => {
          if (nameSaving) return
          setNameModalOpen(false); setNewName(''); setNameError('')
        }}
        title="✏️ Cambiar nombre"
        footer={
          <Button
            variant="primary"
            className="w-full"
            onClick={handleNameChange}
            disabled={nameSaving || newName.trim().length < 2}
          >
            {nameSaving ? 'Guardando...' : 'Guardar nombre'}
          </Button>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nuevo nombre"
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNameError('') }}
            placeholder="Tu nombre"
            maxLength={40}
            data-autofocus
            style={{
              borderColor: nameError ? 'var(--red)' : undefined,
            }}
          />
          {nameError && (
            <p className="font-mono text-[11px] text-center" style={{ color: 'var(--red)' }}>{nameError}</p>
          )}
        </div>
      </Modal>

      {/* ── Modal: Cambiar foto ───────────────────────── */}
      <Modal
        open={photoModalOpen}
        onClose={() => {
          if (photoSaving) return
          setPhotoModalOpen(false); setPhotoError('')
        }}
        title="📷 Foto de perfil"
      >
        <div className="flex flex-col items-center gap-4">
          <Avatar
            name={player.name}
            avatar={player.avatar}
            size={96}
            fontSize={32}
            communityColor={communityColor}
            borderColor={communityColor + '66'}
            borderWidth={3}
          />

          <label
            className="w-full py-3 rounded-m font-bold text-sm uppercase tracking-widest text-center cursor-pointer active:scale-95 transition-transform select-none hairline-top"
            style={{
              background: communityColor,
              color: '#000',
              minHeight: 48,
              pointerEvents: photoSaving ? 'none' : 'auto',
              opacity: photoSaving ? 0.4 : 1,
            }}
          >
            {photoSaving ? 'Subiendo...' : '📷 Elegir imagen'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={photoSaving}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) handlePhotoUpload(file)
              }}
            />
          </label>

          {isAvatarUrl(player.avatar) && (
            <Button
              variant="danger"
              className="w-full"
              onClick={handlePhotoRemove}
              disabled={photoSaving}
            >
              🗑️ Eliminar foto
            </Button>
          )}

          {photoError && (
            <p className="font-mono text-[11px] text-center" style={{ color: 'var(--red)' }}>{photoError}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
