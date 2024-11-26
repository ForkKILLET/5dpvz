import { ZombieId } from '@/data/zombies'
import { ProcessEntity } from '@/entities/Process'
import { Pred } from '@/utils'

export interface WaveData {
    zombieCount: number
    zombieProbs: Partial<Record<ZombieId, number>>
}

export interface WavesData {
    zombieType: ZombieId[]
    waveCount: number
    bigWaveIndex: number[]
    waves: WaveData[]
}

export const BGM_NAMES = [ 'day' ] as const
export type BGMId = typeof BGM_NAMES[number]

export interface StageData {
    id: string
    chapter: number
    track: number
    bgm: BGMId
    wavesData: WavesData
    hasWon: (process: ProcessEntity) => boolean
    hasLost: (process: ProcessEntity) => boolean
}

export type StageResultPred = Pred<ProcessEntity>

export const hasWonByWave: StageResultPred = ({ state, config }) => (
    state.zombiesData.length === 0 && state.wave === config.stage.wavesData.waveCount
)

export const hasLostByZombie: StageResultPred = ({ state }) => (
    state.zombiesData.some(zombie => zombie.entity.state.enteredHouse)
)

export const Stage1_1: StageData = {
    id: '1-1',
    chapter: 1,
    track: 1,
    bgm: 'day',
    wavesData: {
        zombieType: [ 'normal_zombie' ],
        waveCount: 3,
        bigWaveIndex: [ 3 ],
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
    hasWon: hasWonByWave,
    hasLost: hasLostByZombie,
}
