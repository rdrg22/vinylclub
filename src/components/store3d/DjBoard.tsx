/**
 * Pizarra del DJ en la pared del fondo: lo que ha sonado en el tocadiscos, escrito con
 * tiza. Al pulsarla se abre la lista completa (y desde ahí se puede coger cada disco).
 */
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { whenPlayed, type Play } from '@/services/plays/plays'
import { useSurface } from './surfaces'
import { chalkboardTexture } from './textures'

interface Props {
  position: [number, number, number]
  plays: Play[]
  onOpen: () => void
  onHint: (hint: string | null) => void
}

const BOARD = { width: 0.68, height: 0.85 }

export function DjBoard({ position, plays, onOpen, onHint }: Props) {
  const frame = useSurface()('dark_wood', { repeat: [0.6, 0.8], tint: '#4a3020', roughness: 0.6 })
  // «hace 5 min» envejece: se vuelve a escribir cada minuto.
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60000))
  useEffect(() => {
    const timer = setInterval(() => setMinute(Math.floor(Date.now() / 60000)), 60000)
    return () => clearInterval(timer)
  }, [])
  const texture = useMemo(
    () => chalkboardTexture(plays.map((p) => ({ title: p.album.title, artist: p.album.artist, when: whenPlayed(p.playedAt, new Date(minute * 60000)) }))),
    [plays, minute],
  )
  useEffect(() => () => texture.dispose(), [texture])
  const [hovered, setHovered] = useState(false)

  return (
    <group
      position={position}
      scale={hovered ? 1.02 : 1}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
        onHint('Lo que ha sonado en el plato')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        onHint(null)
        document.body.style.cursor = ''
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (e.delta > 6) return
        setHovered(false)
        onHint(null)
        document.body.style.cursor = ''
        onOpen()
      }}
    >
      {/* Marco de madera y la pizarra */}
      <mesh>
        <boxGeometry args={[BOARD.width + 0.08, BOARD.height + 0.08, 0.04]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[BOARD.width, BOARD.height]} />
        <meshStandardMaterial map={texture} roughness={0.95} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={hovered ? 0.18 : 0.08} />
      </mesh>
      {/* Repisa con una tiza */}
      <mesh position={[0, -BOARD.height / 2 - 0.05, 0.04]}>
        <boxGeometry args={[BOARD.width * 0.8, 0.02, 0.06]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[0.18, -BOARD.height / 2 - 0.03, 0.045]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.007, 0.007, 0.07, 8]} />
        <meshStandardMaterial color="#f1ece1" roughness={1} />
      </mesh>
    </group>
  )
}
