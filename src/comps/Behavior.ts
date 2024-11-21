import { Comp, Entity } from '@/engine'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { kAttachToLevel, kLevelState } from '@/entities/Level'
import { PlantEntity } from '@/entities/plants/Plant'
import { remove } from '@/utils'

export class BehaviorComp<E extends Entity = Entity> extends Comp<E> {
    constructor(entity: E) {
        super(entity)
    }
}

export interface PlantAttackConfig<E extends PlantEntity = PlantEntity> {
    cd: number
    initCd?: number
    attack: (entity: E) => void
    canAttack: (entity: E) => boolean
}

export class PlantAttackBehavior<E extends PlantEntity = PlantEntity> extends BehaviorComp<E> {
    constructor(entity: E, public config: PlantAttackConfig<E>) {
        super(entity)
        this.cd = config.initCd ?? config.cd
    }

    cd: number

    update() {
        this.cd += this.entity.game.mspf
        if (this.cd >= this.config.cd && this.config.canAttack(this.entity)) {
            this.cd = 0
            this.config.attack(this.entity)
        }
    }
}

export class ZombieSeekingBehavior<E extends PlantEntity = PlantEntity> extends BehaviorComp<E> {
    seekZombies(rows: number[], direction: 'front' | 'back') {
        const { zombiesData } = this.entity.inject(kLevelState)!
        const { x } = this.entity.state.position

        return zombiesData.filter(({ entity: { state } }) => (
            rows.includes(state.j) &&
            (state.position.x >= x === (direction === 'front'))
        )).length > 0
    }
}

export class BulletShootingBehavior<E extends PlantEntity = PlantEntity> extends BehaviorComp<E> {
    shootBullet(bullet: BulletEntity) {
        const { bulletsData } = this.entity.inject(kLevelState)!
        const attachToLevel = this.entity.inject(kAttachToLevel)!

        bullet.on('dispose', () => {
            remove(bulletsData, ({ entity }) => bullet.id === entity.id)
        })

        bulletsData.push({ id: bullet.config.metadata.id, entity: bullet })
        attachToLevel(bullet)
    }
}
