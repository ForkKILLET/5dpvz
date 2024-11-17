export interface SoundManager {
    sounds: Record<string, HTMLAudioElement>
    loadSound: (src: string) => Promise<HTMLAudioElement>
    playSound: (src: string) => void
    stopSound: (src: string) => void
}

export const useSoundManager = (() => {
    let instance: SoundManager

    const createInstance = (): SoundManager => {
        const sounds: Record<string, HTMLAudioElement> = {}

        return {
            sounds,

            loadSound: async (src: string) => {
                if (sounds[src]) return sounds[src]
                const audio = new Audio(src)
                sounds[src] = audio
                await new Promise((res, rej) => {
                    audio.oncanplaythrough = res
                    audio.onerror = event => {
                        rej(new Error(`Failed to load sound: ${ src }`))
                        console.error(`Failed to load sound: ${ src }\n%o`, event)
                    }
                })
                return audio
            },

            playSound: (src: string) => {
                const sound = sounds[src]
                if (sound) {
                    sound.currentTime = 0
                    sound.play().catch(error => console.error(`Error playing sound: ${ src }\n%o`, error))
                }
                else {
                    console.warn(`Sound not loaded: ${ src }`)
                }
            },

            stopSound: (src: string) => {
                const sound = sounds[src]
                if (sound) {
                    sound.pause()
                    sound.currentTime = 0
                }
            },
        }
    }

    return (): SoundManager => {
        if (! instance) {
            instance = createInstance()
        }
        return instance
    }
})()

export function PlaySound(soundSrc: string) {
    const soundManager = useSoundManager()

    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value
        descriptor.value = async function(...args: any[]) {
            await soundManager.loadSound(soundSrc)
            soundManager.playSound(soundSrc)
            return originalMethod.apply(this, args)
        }
        return descriptor
    }
}
