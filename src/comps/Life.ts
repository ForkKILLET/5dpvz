import { Comp, CompCtor, Emitter, Entity, Events } from '@/engine'

export interface LifeEvents extends Events {
    expire: []
}

export interface LifeConfig {
    maxLife: number
}

export interface LifeState {
    life: number
}

export class LifeComp extends Comp<LifeConfig, LifeState> {
    static create<M extends Comp>(this: CompCtor<M>, entity: Entity, maxLife: number) {
        return new this(entity, { maxLife }, { life: maxLife })
    }

    emitter = new Emitter<LifeEvents>()

    update() {
        this.state.life -= this.entity.game.mspf
        if (this.state.life <= 0) {
            this.entity.dispose()
            this.emitter.emit('expire')
        }
    }
}
