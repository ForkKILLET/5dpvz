import { ZombieId } from '@/data/zombies'
import {LevelUniqueState} from "@/entities/Level";

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
    isWin: (levelState: LevelUniqueState) => boolean
    isLose: (levelState: LevelUniqueState) => boolean
}

export const Stage1_1: StageData = {
    id: '1-1',
    chapter: 1,
    track: 1,
    wavesData: {
        zombieType: ['normal_zombie'],
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
    isWin(levelState: LevelUniqueState) { // TODO: maybe use smaller param 'ZombieData[]'?
        return levelState.zombiesData.length === 0 && levelState.wave === 3
    },
    isLose(levelState: LevelUniqueState) { // TODO: this one as well
        return levelState.zombiesData.some(zombie => zombie.entity.state.position.x < 0)
    },
}
