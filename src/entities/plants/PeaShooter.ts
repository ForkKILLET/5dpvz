import { PLANTS } from '@/data/plants'
import { definePlant, PlantConfig, PlantEntity, PlantState } from '@/entities/plants/Plant'
import { BULLETS } from '@/data/bullets'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { PlantAttackComp } from '@/comps/plants/Attack'
import { BulletShootingComp } from '@/comps/plants/BulletShooting'
import { ZombieSeekingComp } from '@/comps/plants/ZombieSeeking'

void PLANTS
void BULLETS

export const PeaShooterEntity = definePlant(class PeaShooterEntity extends PlantEntity {
    static readonly id = 'pea_shooter'
    static readonly desc = 'Pea Shooter'
    static readonly cost = 100
    static readonly cd = 7500
    static readonly attackCd = 2000
    static readonly hp = 300
    static readonly isPlantableAtStart = true
    static readonly animes = {
        common: { fpaf: 8, frameNum: 12 },
    }

    constructor(config: PlantConfig, state: PlantState) {
        super(config, state)

        this
            .addComp(ZombieSeekingComp)
            .addComp(BulletShootingComp)
            .addComp(PlantAttackComp, {
                maxCd: PeaShooterEntity.attackCd,
                canAttack() {
                    return this.getComp(ZombieSeekingComp)!.seekZombies([ this.state.j ], 'front')
                },
                attack() {
                    const { pos: { x, y }, zIndex } = this.state
                    this.getComp(BulletShootingComp)!.shootBullet(BulletEntity.createBullet(
                        'pea',
                        {},
                        { pos: { x: x + 60, y: y + 25 }, zIndex: zIndex + 1 },
                    ))
                },
            })
    }
})
