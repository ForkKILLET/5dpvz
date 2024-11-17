import { defineZombie, ZombieEntity } from '@/entities/zombies/Zombie'

export const NormalZombieEntity = defineZombie(class NormalZombieEntity extends ZombieEntity {
    static readonly id = 'normal_zombie'
    static readonly name = 'Zombie'
    static readonly hp = 100
    static readonly speed = 100
    static readonly status = { move: 'normal', place: 'land' } as const
    static readonly animations = {
        common: { fpaf: 8, frameNum: 12 },
    }
})
