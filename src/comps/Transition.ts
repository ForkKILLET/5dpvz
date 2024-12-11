import { CompEvents, Comp, Entity, CompCtor, CompSelector } from '@/engine'
import { Direction, PartialBy } from '@/utils'

export interface TransitionConfig<E extends Entity> {
    name: string
    transition: (entity: E, t: number) => void
    defaultTotalFrame: number
}

export interface TransitionState {
    frame: number
    totalFrame: number
    targetFrame: number
    direction: Direction
    toStop: boolean
    play:
        | null
        | {
            mode: 'once'
        }
        | {
            mode: 'loop'
        }
        | {
            mode: 'pingpong'
            isReturning: boolean
        }
}

export type TransitionPlayMode = 'once' | 'loop' | 'pingpong'

export interface TransitionPlayOptions {
    totalFrame?: number
    reset?: boolean
    direction?: Direction
    targetT?: number
}

export interface TransitionEvents extends CompEvents {
    'transition-finish': [ entity: Entity ]
}

export class TransitionComp<
    E extends Entity = Entity
> extends Comp<TransitionConfig<E>, TransitionState, TransitionEvents, E> {
    static create<M extends Comp>(
        this: CompCtor<M>,
        entity: M['entity'],
        config: PartialBy<TransitionConfig<M['entity']>, 'name'>,
    ) {
        return new this(
            entity,
            {
                name: 'default',
                ...config,
            } satisfies TransitionConfig<M['entity']>,
            {
                frame: 0,
                totalFrame: config.defaultTotalFrame,
                direction: 1,
                targetFrame: config.defaultTotalFrame,
                play: null,
                toStop: false,
            } satisfies TransitionState
        )
    }

    static withName(name: string): CompSelector<TransitionComp> {
        return [ TransitionComp, trans => trans.config.name === name ]
    }

    update() {
        const { state } = this

        const { play, totalFrame, targetFrame } = state
        if (! play) return

        this.config.transition(this.entity, state.frame / totalFrame)
        if (state.toStop) {
            state.toStop = false
            return this.stop()
        }

        this.state.frame += state.direction
        if (state.frame === targetFrame || state.frame === - 1) {
            switch (play.mode) {
                case 'once': {
                    this.stopAtNextFrame()
                    break
                }
                case 'loop': {
                    state.frame += targetFrame
                    break
                }
                case 'pingpong': {
                    state.direction *= - 1
                    state.frame += state.direction
                    if (play.isReturning) return this.stopAtNextFrame()
                    play.isReturning = true
                    break
                }
            }
        }
    }

    stopAtNextFrame() {
        this.state.toStop = true
    }

    stop() {
        this.state.play = null
        this.emitter.emit('transition-finish', this.entity)
    }

    start(mode: TransitionPlayMode, {
        totalFrame = this.config.defaultTotalFrame,
        reset = false,
        direction,
        targetT = 1,
    }: TransitionPlayOptions = {}): Promise<void> {
        const { state } = this

        state.totalFrame = totalFrame
        state.targetFrame = targetT * totalFrame
        if (typeof direction === 'number') state.direction = direction
        if (reset) state.frame = state.direction > 0 ? 0 : totalFrame - 1

        switch (mode) {
            case 'once': {
                state.play = { mode }
                break
            }
            case 'loop': {
                state.play = { mode }
                break
            }
            case 'pingpong': {
                state.play = { mode, isReturning: false }
                break
            }
        }

        return new Promise(res => {
            this.emitter.on('transition-finish', () => res(), { once: true })
        })
    }
}
