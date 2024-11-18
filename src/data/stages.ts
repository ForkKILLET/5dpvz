import { ZombieId } from '@/data/zombies'

export interface WaveData {
    zombieCount: number
    zombieProbs: Partial<Record<ZombieId, number>>
}

export interface WavesData {
    zombieType: ZombieId[]
    waveCount: number
    waves: WaveData[]
}

export interface StageData {
    id: string
    chapter: number
    track: number
    wavesData: WavesData
}

export const Stage1_1: StageData = {
    id: '1-1',
    chapter: 1,
    track: 1,
    wavesData: {
        zombieType: [ 'normal_zombie' ],
        waveCount: 3,
        waves: [
            {
                zombieCount: 1,
                zombieProbs: {
                    normal_zombie: 1,
                },
            },
            {
                zombieCount: 2,
                zombieProbs: {
                    normal_zombie: 1,
                },
            },
            {
                zombieCount: 3,
                zombieProbs: {
                    normal_zombie: 1,
                },
            },
        ],
    },
}
