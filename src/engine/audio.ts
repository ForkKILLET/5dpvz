export interface AudioManager {
    audios: Record<string, HTMLAudioElement>
    loadAudio: (src: string) => Promise<HTMLAudioElement>
    playAudio: (src: string) => void
}

export const useAudioManager = (): AudioManager => {
    const audios: Record<string, HTMLAudioElement> = {}
    return {
        audios: audios,
        loadAudio: async (src: string) => {
            if (audios[src]) return audios[src]
            const audio = new Audio(src)
            audios[src] = audio
            await new Promise((res, rej) => {
                audio.oncanplaythrough = res
                audio.onerror = event => {
                    rej(new Error(`Failed to load sound: ${ src }`))
                    console.error(`Failed to load sound: ${ src }\n%o`, event)
                }
            })
            return audio
        },
        playAudio: (src: string) => {
            // FIXME: play same audio multiple times
            const sound = audios[src]
            if (sound) {
                sound.currentTime = 0
                return sound.play()
            }
            else {
                throw new Error(`Sound not loaded: ${ src }`)
            }
        },
    }
}
