import { Comp, Entity } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'

export class BehaviorComp<E extends Entity = Entity> extends Comp<E> {
    constructor(entity: E) {
        super(entity)
    }
}

export interface PlantAttackConfig<E extends PlantEntity = PlantEntity> {
    coolDown: number
    attack: (entity: E) => void
    canAttack: (entity: E) => boolean
}

export class PlantAttackBehavior<E extends PlantEntity = PlantEntity> extends BehaviorComp<E> {
    constructor(entity: E, public config: PlantAttackConfig<E>) {
        super(entity)
    }

    cd = 0

    update() {
        this.cd += this.entity.game.mspf
        if (this.cd >= this.config.coolDown && this.config.canAttack(this.entity)) {
            this.cd = 0
            this.config.attack(this.entity)
        }
    }
}

