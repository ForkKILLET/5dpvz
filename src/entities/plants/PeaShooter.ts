import { PlantAttackBehavior } from '@/comps/Behavior'
import { definePlant, PlantConfig, PlantEntity, PlantState } from '@/entities/plants/Plant'
import { BulletEntity } from '../bullets/Bullet'

export const PeaShooterEntity = definePlant(class PeaShooterEntity extends PlantEntity {
    static readonly id = 'pea_shooter'
    static readonly name = 'Pea Shooter'
    static readonly cost = 100
    static readonly cd = 7_500
    static readonly attackCd = 2_000
    static readonly hp = 300
    static readonly isPlantableAtStart = true
    static readonly animations = {
        common: { fpaf: 8, frameNum: 12 },
    }

    constructor(config: PlantConfig, state: PlantState) {
        super(config, state)

        this.addComp(PlantAttackBehavior, {
            coolDown: PeaShooterEntity.attackCd,
            attack: () => {
                const { position: { x, y }, zIndex } = this.state
                this.shootBullet(BulletEntity.create(
                    'pea',
                    {},
                    { position: { x: x + 60, y: y + 25 }, zIndex: zIndex + 1 },
                ))
            },
            canAttack: () => this.seekZombies([ this.state.j ], 'front'),
        })
    }
})
