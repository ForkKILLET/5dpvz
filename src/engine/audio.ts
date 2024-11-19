export interface AudioPlayback {
    toggleEffect: () => void
    stop: () => void
    isEffectApplied: boolean
}

export interface AudioManager {
    audioContext: AudioContext
    audios: Record<string, AudioBuffer>
    loadAudio: (src: string) => Promise<AudioBuffer>
    playAudio: (
        src: string,
        options?: {
            loop?: boolean
            playbackRate?: number
        }
    ) => AudioPlayback
}

export const useAudioManager = (): AudioManager => {
    const audioContext = new AudioContext()
    const audios: Record<string, AudioBuffer> = {}

    document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume()
        }
    }, { once: true })

    const loadAudio = async (src: string): Promise<AudioBuffer> => {
        if (audios[src]) return audios[src]
        const response = await fetch(src)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        audios[src] = audioBuffer
        return audioBuffer
    }

    const playAudio = (
        src: string,
        options: {
            loop?: boolean
            playbackRate?: number
        } = {}
    ): AudioPlayback => {

        const audioBuffer = audios[src]
        if (! audioBuffer) {
            throw new Error(`Sound not loaded: ${ src }`)
        }

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
        loadAudio,
        playAudio,
    }
}
