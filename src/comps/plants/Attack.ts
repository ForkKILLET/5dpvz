import { PLANTS } from '@/data/plants'
import { Comp, CompCtor, CompEvents } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'

void PLANTS

export interface PlantAttackConfig<E extends PlantEntity = PlantEntity> {
    maxCd: number
    initCd?: number
    attack: (this: E) => void
    canAttack: (this: E) => boolean
}

export interface PlantAttackState {
    cd: number
}

export interface PlantAttackEvents extends CompEvents {}

export class PlantAttackComp<
    E extends PlantEntity = PlantEntity
> extends Comp<PlantAttackConfig, PlantAttackState, PlantAttackEvents, E> {
    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], config: PlantAttackConfig): M {
        return new this(entity, config, { cd: config.initCd ?? config.maxCd })
    }

    update() {
        this.updateTimer('cd', { interval: this.config.maxCd }, () => {
            if (this.config.canAttack.call(this.entity)) {
                this.state.cd = 0
                this.config.attack.call(this.entity)
            }
        })
    }
}

