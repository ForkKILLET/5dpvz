import { defineZombie, ZombieEntity, ZombieEvents, ZombieState } from '@/entities/zombies/Zombie'

export interface NormalZombieState extends ZombieState {}

export interface NormalZombieEvents extends ZombieEvents {}

export const NormalZombieEntity = defineZombie(class NormalZombieEntity extends ZombieEntity<
    NormalZombieState,
    NormalZombieEvents
> {
    static readonly id = 'normal_zombie'
    static readonly desc = 'Normal Zombie'
    static readonly hp = 100
    static readonly atk = 10
    static readonly speed = 10 / 1000
    static readonly damage = 10
    static readonly animes = {
        common: { fpaf: 8, frameNum: 1 },
    }
})
