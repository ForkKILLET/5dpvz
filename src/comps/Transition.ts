import { CompEvents, Comp, Entity, CompCtor } from '@/engine'
import { Direction } from '@/utils'

export interface TransitionConfig<E extends Entity> {
    transition: (entity: E, t: number) => void
    defaultTotalFrame: number
}

export interface TransitionState {
    frame: number
    totalFrame: number
    direction: Direction
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
            returning: boolean
        }
}

export type TransitionPlayMode = 'once' | 'loop' | 'pingpong'

export interface TransitionPlayOptions {
    totalFrame?: number
    resetDirection?: boolean
}

export interface TransitionEvents extends CompEvents {
    'transition-finish': [ entity: Entity ]
}

export class TransitionComp<E extends Entity> extends Comp<TransitionConfig<E>, TransitionState, TransitionEvents, E> {
    static create<M extends Comp>(
        this: CompCtor<M>,
        entity: M['entity'],
        config: TransitionConfig<M['entity']>,
    ) {
        return new this(entity, config, {
            frame: 0,
            totalFrame: config.defaultTotalFrame,
            direction: 1,
            play: null,
        } satisfies TransitionState)
    }

    update() {
        const { play } = this.state
        if (! play) return

        this.config.transition(this.entity, this.state.frame / this.state.totalFrame)
        this.state.frame += this.state.direction
        if (this.state.frame === this.state.totalFrame || this.state.frame === - 1) {
            switch (play.mode) {
                case 'once': {
                    this.stop()
                    break
                }
                case 'loop': {
                    this.state.frame += this.state.totalFrame
                    break
                }
                case 'pingpong': {
                    this.state.direction *= - 1
                    this.state.frame += this.state.direction
                    if (play.returning) return this.stop()
                    play.returning = true
                    break
                }
            }
        }
    }

    stop() {
        this.state.play = null
        this.emitter.emit('transition-finish', this.entity)
    }

    start(mode: TransitionPlayMode, {
        totalFrame = this.config.defaultTotalFrame,
        resetDirection = false,
    }: TransitionPlayOptions = {}) {
        this.state.totalFrame = totalFrame
        if (resetDirection) this.state.direction = 1
        switch (mode) {
            case 'once': {
                this.state.play = { mode }
                break
            }
            case 'loop': {
                this.state.play = { mode }
                break
            }
            case 'pingpong': {
                this.state.play = { mode, returning: false }
                break
            }
        }
        return this
    }
}
