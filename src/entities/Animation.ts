import { EntityEvents, EntityState, Entity, Game } from '@/engine'

export interface AnimationData {
    fpsf: number
    frameNum: number
}

export interface AnimationConfig {
    srcs: string[]
    fpsf: number
}

export interface AnimationUniqueState {
    f: number
    sf: number
    isPlaying: boolean
    direction: 1 | - 1
}
export interface AnimationState extends EntityState, AnimationUniqueState {}

export interface AnimationEvents extends EntityEvents {
    'animation-finish': []
}

export type AnimationSetData = {
    common: AnimationData
    [name: string]: AnimationData
}

export type MetadataWithAnimationSet = Record<string, { animations: AnimationSetData }>

export const useAnimation = <M extends MetadataWithAnimationSet>(category: string, metadata: M) => {
    type Id = keyof M & string
    const animation = {
        getImageSrc: (id: Id) => `./assets/${ category }/${ id }/common/01.png`,
        getImageConfig: (id: Id) => ({ src: animation.getImageSrc(id) }),
        getAnimationConfig: (id: Id, name = 'common'): AnimationConfig => {
            const { frameNum, fpsf } = metadata[id].animations[name]
            const srcs = Array.from(
                { length: frameNum },
                (_, i) => `./assets/plants/${ id }/${ name }/${ String(i + 1).padStart(2, '0') }.png`,
            )
            return { srcs, fpsf }
        },
    }
    return animation
}

export class AnimationEntity<
    C extends AnimationConfig = AnimationConfig,
    S extends AnimationState = AnimationState,
    E extends AnimationEvents = AnimationEvents
> extends Entity<C, S, E> {
    static initState = <S>(state: S): S & AnimationUniqueState => ({
        ...state,
        f: 0,
        sf: 0,
        isPlaying: true,
        direction: 1,
    })

    static getStdSrcs = (path: string, num: number): string[] => {
        const digits = Math.max(String(num).length, 2)
        return Array
            .from({ length: num })
            .map((_, i) => `${ path }/${ String(i + 1).padStart(digits, '0') }.png`)
    }

    frames: HTMLImageElement[] = []

    async start(game: Game) {
        await super.start(game)
        this.frames = await Promise.all(
            this.config.srcs.map(src => game.imageManager.loadImage(src)),
        )
    }

    render() {
        const { position: { x, y }, sf } = this.state
        this.game.ctx.drawImage(this.frames[sf], x, y)
    }

    update() {
        let { f, sf, isPlaying, direction } = this.state
        if (! isPlaying) return this.state
        if (++ f === this.config.fpsf) {
            this.emit('animation-finish')
            f = 0
            if ((sf += direction) === this.frames.length) sf = 0
        }
        return { ...this.state, f, sf }
    }
}
