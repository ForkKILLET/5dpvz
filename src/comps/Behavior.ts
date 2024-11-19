import { Comp, Entity } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { BulletData, LevelEntity } from '@/entities/Level'

export class BehaviorComp<E extends Entity = Entity> extends Comp<E> {
    constructor(entity: E) {
        super(entity)
    }
}

export class PlantAttackBehavior<E extends PlantEntity = PlantEntity> extends BehaviorComp<E> {
    constructor(
        entity: E,
        public cooldown: number = 0,
        public onAttack: () => void,
        public canAttack: () => boolean,
    ) {
        super(entity)
    }

    currentCooldown: number = 0

    update() {
        this.currentCooldown += this.entity.game.mspf
        if (this.currentCooldown >= this.cooldown && this.canAttack()) {
            this.currentCooldown = 0
            this.onAttack()
        }
    }
}

export class PlantBulletAttackBehavior<E extends PlantEntity = PlantEntity> extends PlantAttackBehavior<E> {
    constructor(
        entity: E,
        public cooldown: number = 0,
        public bulletFactory: (entity: E) => BulletEntity,
        public level: LevelEntity,
    ) {
        super(
            entity,
            cooldown,
            () => {
                this.pushBullet(level)
            },
            () => level.state.zombiesData.some(
                zombieData => zombieData.entity.state.position.y === this.entity.state.position.y // TODO: approx match
                && zombieData.entity.state.position.x > this.entity.state.position.x // TODO: offset
                && zombieData.entity.config.metadata.status.move !== 'hypnotised'
                && zombieData.entity.config.metadata.status.place === 'land' || 'swim'
            ),
        )
    }

    pushBullet(level: LevelEntity) {
        const bullet: BulletEntity = this.bulletFactory(this.entity)
        const bulletData: BulletData = {
            id: bullet.config.metadata.id,
            position: level.getLawnBlockPosition(
                this.entity.state.position.x,
                this.entity.state.position.y,
            ),
            entity: bullet,
        }
        level.state.bulletsData.push(bulletData)
    }
}
