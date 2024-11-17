import { Comp, Entity } from '@/engine'

export class UpdaterComp extends Comp {
    constructor(entity: Entity, public updater: (entity: Entity) => void) {
        super(entity)
    }

    update() {
        this.updater(this.entity)
    }
}
