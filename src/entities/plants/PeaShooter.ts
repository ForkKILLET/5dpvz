import { PLANTS } from '@/data/plants'
import { definePlant, PlantConfig, PlantEntity, PlantState } from '@/entities/plants/Plant'
import { BULLETS } from '@/data/bullets'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { PlantAttackBehavior } from '@/comps/plantBehaviors/Attack'
import { BulletShootingBehavior } from '@/comps/plantBehaviors/BulletShooting'
import { ZombieSeekingBehavior } from '@/comps/plantBehaviors/ZombieSeeking'

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
            .addComp(ZombieSeekingBehavior)
            .addComp(BulletShootingBehavior)
            .withComps([ ZombieSeekingBehavior, BulletShootingBehavior ], (seeking, shooting) => this
                .addComp(PlantAttackBehavior, {
                    maxCd: PeaShooterEntity.attackCd,
                    canAttack: () => seeking.seekZombies([ this.state.j ], 'front'),
                    attack: () => {
                        const { position: { x, y }, zIndex } = this.state
                        shooting.shootBullet(BulletEntity.createBullet(
                            'pea',
                            {},
                            { position: { x: x + 60, y: y + 25 }, zIndex: zIndex + 1 },
                        ))
                    },
                })
            )
    }
})
