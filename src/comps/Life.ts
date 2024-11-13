import { Comp, Emitter, Entity, Events } from '@/engine'

export interface LifeEvents extends Events {
    expire: []
}

export class LifeComp extends Comp {
    constructor(entity: Entity, public life: number) {
        super(entity)
    }

    emitter = new Emitter<LifeEvents>()

    update() {
        this.life -= this.entity.game.mspf
        if (this.life <= 0) {
            this.entity.dispose()
            this.emitter.emit('expire')
        }
    }
}
