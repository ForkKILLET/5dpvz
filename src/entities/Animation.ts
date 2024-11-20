import { OriginConfig, RectShape } from '@/comps/Shape'
import { EntityEvents, EntityState, Entity } from '@/engine'
import { MakeOptional, StrictOmit } from '@/utils'

export interface AnimationData {
    fpaf: number
    frameNum: number
}

export interface AnimationConfig extends OriginConfig {
    animations: Record<string, {
        srcs: string[]
        fpaf: number
    }>
}

export interface AnimationUniqueState {
    f: number
    af: number
    isPlaying: boolean
    direction: 1 | - 1
}
export interface AnimationState extends EntityState, AnimationUniqueState {
    currentAnimationName: string
}

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
        getAnimationConfig: (id: Id): StrictOmit<AnimationConfig, 'origin'> => {
            const animations: AnimationConfig['animations'] = {}

            for (const [ name, data ] of Object.entries(metadata[id].animations)) {
                const { frameNum, fpaf } = data
                const srcs = Array.from(
                    { length: frameNum },
                    (_, i) =>
                        `./assets/${ category }/${ id }/${ name }/${ String(i + 1).padStart(2, '0') }.png`
                )
                animations[name] = { srcs, fpaf }
            }

            return { animations }
        },
        getAllSrcs: () =>
            Object.keys(metadata)
                .map(id =>
                    Object.values(animation.getAnimationConfig(id).animations)
                        .map(anim => anim.srcs)
                        .flat()
                )
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
    >(config: C, state: MakeOptional<S, 'f' | 'af' | 'isPlaying' | 'direction' | 'currentAnimationName'>) {
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
                currentAnimationName: state.currentAnimationName || Object.keys(config.animations)[0],
            }
        )
    }

    // static getStdSrcs = (path: string, num: number): string[] => {
    //     const digits = Math.max(String(num).length, 2)
    //     return Array
    //         .from({ length: num })
    //         .map((_, i) => `${ path }/${ String(i + 1).padStart(digits, '0') }.png`)
    // }

    frames: Record<string, HTMLImageElement[]> = {}
    currentFrames: HTMLImageElement[] = []
    fpaf: number = 1

    async start() {
        await super.start()
        const animationNames = Object.keys(this.config.animations)
        for (const name of animationNames) {
            const { srcs } = this.config.animations[name]
            this.frames[name] = await Promise.all(
                srcs.map(src => this.game.imageManager.loadImage(src))
            )
        }
        this.switchAnimation(this.state.currentAnimationName)
        const { width, height } = this.currentFrames[0]
        this.addComp(RectShape, { width, height, origin: this.config.origin })
    }

    switchAnimation(name: string) {
        if (! this.frames[name]) {
            throw new Error(`Animation ${ name } does not exist`)
        }
        this.state.currentAnimationName = name
        this.currentFrames = this.frames[name]
        this.fpaf = this.config.animations[name].fpaf
        this.state.f = 0
        this.state.af = 0
    }

    render() {
        const { af } = this.state
        const { x, y, width, height } = this.getComp(RectShape)!.rect
        this.game.ctx.drawImage(this.currentFrames[af], x, y, width, height)
    }

    update() {
        const { state } = this
        const { isPlaying, direction } = state
        if (! isPlaying) return
        if (++ state.f === this.fpaf) {
            this.emit('animation-finish')
            state.f = 0
            state.af += direction
            if (state.af >= this.currentFrames.length || state.af < 0) {
                state.af = 0
            }
        }
    }
}
