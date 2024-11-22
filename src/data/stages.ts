import { ZombieId } from '@/data/zombies'
import { LevelEntity } from '@/entities/Level'
import { Pred } from '@/utils'

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
    hasWon: (level: LevelEntity) => boolean
    hasLost: (level: LevelEntity) => boolean
}

export type StageResultPred = Pred<LevelEntity>

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
    hasWon: hasWonByWave,
    hasLost: hasLostByZombie,
}
