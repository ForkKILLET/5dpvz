import { OriginConfig, RectShape } from '@/comps/Shape'
import { EntityEvents, EntityState, Entity } from '@/engine'
import { MakeOptional, placeholder, StrictOmit } from '@/utils'

export interface AnimationData {
    fpaf: number
    frameNum: number
}

export interface AnimationConfig extends OriginConfig {
    srcs: string[]
    fpaf: number
}

export interface AnimationUniqueState {
    f: number
    af: number
    isPlaying: boolean
    direction: 1 | - 1
}
export interface AnimationState extends EntityState, AnimationUniqueState {}

export interface AnimationEvents extends EntityEvents {
    'animation-finish': []
}

export type AnimationCategory = 'plants' | 'zombies' | 'shovels' | 'bullets'

export type AnimationSetData = {
    common: AnimationData
    [name: string]: AnimationData
}

export type MetadataWithAnimationSet = Record<string, { animations: AnimationSetData }>

export const useAnimation = <M extends MetadataWithAnimationSet>(category: AnimationCategory, metadata: M) => {
    type Id = keyof M & string
    const animation = {
        getImageSrc: (id: Id) => `./assets/${ category }/${ id }/common/01.png`,
        getImageConfig: (id: Id) => ({ src: animation.getImageSrc(id) }),
        getAnimationConfig: (id: Id, name = 'common'): StrictOmit<AnimationConfig, 'origin'> => {
            const { frameNum, fpaf: fpaf } = metadata[id].animations[name]
            const srcs = Array.from(
                { length: frameNum },
                (_, i) => `./assets/${ category }/${ id }/${ name }/${ String(i + 1).padStart(2, '0') }.png`,
            )
            return { srcs, fpaf }
        },
        getAllSrcs: () => Object
            .keys(metadata)
            .map(id => animation.getAnimationConfig(id).srcs)
            .flat(),
    }
    return animation
}

export class AnimationEntity<
    C extends AnimationConfig = AnimationConfig,
    S extends AnimationState = AnimationState,
    E extends AnimationEvents = AnimationEvents
> extends Entity<C, S, E> {
    static create<
        C extends MakeOptional<AnimationConfig, 'origin'>,
        S extends AnimationState
    >(config: C, state: MakeOptional<S, 'f' | 'af' | 'isPlaying' | 'direction'>) {
        return new this(
            {
                origin: 'top-left',
                ...config,
            },
            {
                ...state,
                f: 0,
                af: 0,
                direction: + 1,
                isPlaying: true,
            }
        )
    }

    static getStdSrcs = (path: string, num: number): string[] => {
        const digits = Math.max(String(num).length, 2)
        return Array
            .from({ length: num })
            .map((_, i) => `${ path }/${ String(i + 1).padStart(digits, '0') }.png`)
    }

    frames: HTMLImageElement[] = placeholder

    async start() {
        await super.start()
        this.frames = await Promise.all(
            this.config.srcs.map(src => this.game.imageManager.loadImage(src))
        )
        const { width, height } = this.frames[0]
        this.addComp(RectShape, { width, height, origin: this.config.origin })
    }

    render() {
        const { af } = this.state
        const { x, y, width, height } = this.getComp(RectShape)!.rect
        this.game.ctx.drawImage(this.frames[af], x, y, width, height)
    }

    update() {
        const { state } = this
        const { isPlaying, direction } = state
        if (! isPlaying) return this.state
        if (++ state.f === this.config.fpaf) {
            this.emit('animation-finish')
            state.f = 0
            if ((state.af += direction) === this.frames.length) state.af = 0
        }
    }
}
