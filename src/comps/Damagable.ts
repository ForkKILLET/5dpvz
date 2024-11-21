import { Comp, Entity } from '@/engine'

export class DamagableComp<E extends Entity> extends Comp<E> {
    constructor(entity: E) {
        super(entity)
    }
}
