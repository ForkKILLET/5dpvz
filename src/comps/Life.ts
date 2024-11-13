import { Comp, Emitter, Entity, Events } from '@/engine'

export interface LifeEvents extends Events {
    expire: []
}

export class LifeComp extends Comp {
    constructor(public life: number) {
        super()
    }

    emitter = new Emitter<LifeEvents>()

    update(entity: Entity): void {
        this.life -= entity.game.mspf
        if (this.life <= 0) {
            entity.dispose()
            this.emitter.emit('expire')
        }
    }
}