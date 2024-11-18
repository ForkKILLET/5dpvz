import { defineZombie, ZombieEntity, ZombieEvents, ZombieState } from '@/entities/zombies/Zombie'

export interface NormalZombieState extends ZombieState {}

export interface NormalZombieEvents extends ZombieEvents {}

export const NormalZombieEntity = defineZombie(class NormalZombieEntity extends ZombieEntity<
    NormalZombieState,
    NormalZombieEvents
> {
    static readonly id = 'normal_zombie'
    static readonly name = 'Zombie'
    static readonly hp = 100
    static readonly speed = 40 / 1000
    static readonly status = { move: 'normal', place: 'land' } as const
    static readonly animations = {
        common: { fpaf: 8, frameNum: 1 },
    }
})
