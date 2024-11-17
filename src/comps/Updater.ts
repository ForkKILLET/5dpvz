import { Comp, Entity } from '@/engine'

export class UpdaterComp<E extends Entity> extends Comp {
    constructor(entity: E, public updater: (entity: E) => void) {
        super(entity)
    }

    update() {
        this.updater(this.entity as E)
    }
}
