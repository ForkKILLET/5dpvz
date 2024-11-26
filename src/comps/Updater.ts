import { Comp, CompCtor, CompEvents, Entity } from '@/engine'

export type Updater<E extends Entity = Entity> = (entity: E) => void

export interface UpdaterConfig<E extends Entity = Entity> {
    updater: Updater<E>
}

export interface UpdaterState {}

export interface UpdaterEvents extends CompEvents {}

export class UpdaterComp<E extends Entity> extends Comp<UpdaterConfig<E>, UpdaterState, UpdaterEvents, E> {
    static create<M extends Comp>(this: CompCtor<M>, entity: Entity, updater: Updater): M {
        return new this(entity, { updater }, {})
    }

    update() {
        this.config.updater(this.entity)
    }
}
