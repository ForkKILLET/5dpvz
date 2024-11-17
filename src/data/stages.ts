import { ZombieId } from '@/data/zombies'
import { rep } from '@/utils'

export type StageConfig = {
  id: string
  chapter: number
  track: number
  waveData: {
    zombieType: ZombieId[]
    waveSum: number
    waves: ZombieId[][]
  }
}

export const Stage1_1: StageConfig = {
    id: '1-1',
    chapter: 1,
    track: 1,
    waveData: {
        zombieType: [ 'normal_zombie' as const ],
        waveSum: 20,
        waves: rep(
            rep('normal_zombie', 1), 3,
            rep('normal_zombie', 2), 2,
            rep('normal_zombie', 3), 2,
            rep('normal_zombie', 5), 2,
            rep('normal_zombie', 10), 1,
            rep('normal_zombie', 6), 3,
            rep('normal_zombie', 8), 3,
            rep('normal_zombie', 10), 3,
            rep('normal_zombie', 15), 1,
        ),
    },
}
