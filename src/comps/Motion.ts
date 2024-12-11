import { Comp, CompCtor, CompEvents, Entity, Motion } from '@/engine'

export interface MotionConfig<Sm extends {}> {
    motion: Motion<Sm>
    once?: boolean
}

export type MotionState<Sm> = Sm & {
    finished: boolean
}

export interface MotionEvents extends CompEvents {
    'motion-finish': [ entity: Entity ] // TODO: auto
}

export class MotionComp<Sm extends {}> extends Comp<MotionConfig<Sm>, MotionState<Sm>, MotionEvents> {
    static create<M extends Comp, const Sm extends {}>(
        this: CompCtor<M>,
        entity: M['entity'],
        config: MotionConfig<Sm>,
        state: Sm,
    ) {
        return new this(
            entity,
            { once: true, ...config },
            { ...state, finished: false }
        )
    }

    update() {
        if (this.state.finished) return
        const delta = this.config.motion(this.state)
        if (! delta) {
            this.state.finished = true
            this.emitter.emit('motion-finish', this.entity)
            if (this.config.once) this.dispose()
        }
        else this.entity.updatePosBy(delta)
    }
}
