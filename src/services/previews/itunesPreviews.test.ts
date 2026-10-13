import { describe, expect, it } from 'vitest'
import { matchPreview } from './itunesPreviews'

const track = (artistName: string, collectionName: string, trackName = 'Pista') => ({
  kind: 'song',
  artistName,
  collectionName,
  trackName,
  previewUrl: `https://audio.example/${trackName}.m4a`,
})

describe('matchPreview', () => {
  it('acepta la pista si coinciden artista y álbum, ignorando ediciones y acentos', () => {
    const preview = matchPreview({ artist: 'Björk', title: 'Homogenic' }, [track('Bjork', 'Homogenic (Remastered)', 'Jóga')])
    expect(preview?.trackName).toBe('Jóga')
  })

  it('rechaza pistas de otro disco del mismo artista', () => {
    expect(matchPreview({ artist: 'Radiohead', title: 'Kid A' }, [track('Radiohead', 'OK Computer')])).toBeNull()
  })

  it('rechaza el mismo título de otro artista', () => {
    expect(matchPreview({ artist: 'Miles Davis', title: 'Kind of Blue' }, [track('TQ', 'Kind of Blue')])).toBeNull()
  })

  it('no acepta resultados sin audio', () => {
    expect(matchPreview({ artist: 'Nirvana', title: 'Nevermind' }, [{ ...track('Nirvana', 'Nevermind'), previewUrl: undefined }])).toBeNull()
  })
})
