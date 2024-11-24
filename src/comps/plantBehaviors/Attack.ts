import { PLANTS } from '@/data/plants'
import { Comp, CompCtor } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'

void PLANTS

export interface PlantAttackConfig<E extends PlantEntity = PlantEntity> {
    maxCd: number
    initCd?: number
    attack: (entity: E) => void
    canAttack: (entity: E) => boolean
}

export interface PlantAttackState {
    cd: number
}

export class PlantAttackBehavior<
    E extends PlantEntity = PlantEntity
> extends Comp<PlantAttackConfig, PlantAttackState, E> {
    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], config: PlantAttackConfig): M {
        return new this(entity, config, { cd: config.initCd ?? config.maxCd })
    }

    update() {
        this.updateTimer('cd', { interval: this.config.maxCd }, () => {
            if (this.config.canAttack(this.entity)) {
                this.state.cd = 0
                this.config.attack(this.entity)
            }
        })
    }
}

