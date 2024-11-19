export interface AudioPlayback {
    toggleEffect: () => void
    stop: () => void
    isEffectApplied: boolean
}

export interface AudioPlayOptions {
    loop?: boolean
    playbackRate?: number
}

export interface AudioManager {
    audioContext: AudioContext
    audios: Record<string, AudioBuffer>
    loadingAudios: Record<string, Promise<AudioBuffer>>
    loadAudio: (src: string) => Promise<AudioBuffer>
    playAudio: (src: string, options?: AudioPlayOptions) => AudioPlayback
}

export const useAudioManager = (): AudioManager => {
    const audioContext = new AudioContext()
    const audios: Record<string, AudioBuffer> = {}
    const loadingAudios: Record<string, Promise<AudioBuffer>> = {}

    document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume()
        }
    }, { once: true })

    const _loadAudio = async (src: string): Promise<AudioBuffer> => {
        const response = await fetch(src)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        return audios[src] = audioBuffer
    }

    const loadAudio = async (src: string): Promise<AudioBuffer> => {
        if (src in audios) return audios[src]
        if (src in loadingAudios) return loadingAudios[src]
        return loadingAudios[src] = _loadAudio(src)
    }

    const playAudio = (src: string, options: AudioPlayOptions = {}): AudioPlayback => {
        const audioBuffer = audios[src]
        if (! audioBuffer)
            throw new Error(`Sound not loaded: ${ src }`)

        const sourceNode = audioContext.createBufferSource()
        sourceNode.buffer = audioBuffer
        sourceNode.loop = options.loop ?? false
        sourceNode.playbackRate.value = options.playbackRate ?? 1.0

        const dryGainNode = audioContext.createGain()
        const wetGainNode = audioContext.createGain()

        dryGainNode.gain.value = 1.0
        wetGainNode.gain.value = 0.0

        const effectNode = audioContext.createBiquadFilter()
        effectNode.type = 'lowpass'
        effectNode.frequency.value = 2000

        sourceNode.connect(dryGainNode)
        sourceNode.connect(effectNode)
        effectNode.connect(wetGainNode)
        dryGainNode.connect(audioContext.destination)
        wetGainNode.connect(audioContext.destination)

        sourceNode.start(0)

        let isEffectApplied = false

        const toggleEffect = () => {
            if (isEffectApplied) {
                dryGainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.1)
                wetGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.1)
                sourceNode.playbackRate.setTargetAtTime(1.0, audioContext.currentTime, 0.1)
                isEffectApplied = false
            }
            else {
                dryGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.1)
                wetGainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.1)
                sourceNode.playbackRate.setTargetAtTime(0.8, audioContext.currentTime, 0.1)
                isEffectApplied = true
            }
        }

        const stop = () => {
            sourceNode.stop()
            sourceNode.disconnect()
            dryGainNode.disconnect()
            wetGainNode.disconnect()
            effectNode.disconnect()
        }

        return {
            toggleEffect,
            stop,
            isEffectApplied,
        }
    }

    return {
        audioContext,
        audios,
        loadingAudios,
        loadAudio,
        playAudio,
    }
}
