import { PLANTS } from '@/data/plants'
import { Comp } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'

void PLANTS

export interface PlantAttackConfig<E extends PlantEntity = PlantEntity> {
    cd: number
    initCd?: number
    attack: (entity: E) => void
    canAttack: (entity: E) => boolean
}

export class PlantAttackBehavior<E extends PlantEntity = PlantEntity> extends Comp<E> {
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

