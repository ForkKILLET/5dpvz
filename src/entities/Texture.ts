import { ButtonComp, ButtonEvents } from '@/comps/Button'
import { HoverableComp } from '@/comps/Hoverable'
import { OriginConfig, RectShape } from '@/comps/Shape'
import { TextureSet } from '@/data/textures'
import { Entity, EntityCtor, EntityEvents, EntityState } from '@/engine'
import { PartialBy, pick, placeholder, StrictOmit } from '@/utils'

export type TextureInnerState =
    | {
        type: 'anime'
        f: number
        af: number
        isPlaying: boolean
        direction: 1 | - 1
    }
    | { type: 'image' }

export interface TextureConfig extends OriginConfig {
    textures: TextureSet
    defaultTextureName: string
}

export interface TextureState extends EntityState {
    innerState: TextureInnerState
    textureName: string
}

export interface TextureEvents extends EntityEvents {
    'anime-finish': []
}

export interface TextureEntityCtor<E extends TextureEntity = TextureEntity> extends EntityCtor<E> {
    createTexture<E extends TextureEntity = TextureEntity>(
        this: TextureEntityCtor<E>,
        config: PartialBy<E['config'], 'origin' | 'defaultTextureName'>,
        state: StrictOmit<E['state'], 'textureName' | 'innerState'>
    ): E

    createTextureFromImage<E extends TextureEntity = TextureEntity>(
        this: TextureEntityCtor<E>,
        src: string,
        config: PartialBy<E['config'], 'origin' | 'textures' | 'defaultTextureName'>,
        state: StrictOmit<E['state'], 'textureName' | 'innerState'>
    ): E
}

export class TextureEntity<
    C extends TextureConfig = TextureConfig,
    S extends TextureState = TextureState,
    V extends TextureEvents = TextureEvents
> extends Entity<C, S, V> {
    images: Record<string, HTMLImageElement> = {}
    frames: Record<string, HTMLImageElement[]> = {}

    constructor(config: C, state: S) {
        super(config, state)
        this.state.textureName = config.defaultTextureName
    }

    static createTexture<E extends TextureEntity = TextureEntity>(
        this: TextureEntityCtor<E>,
        config: PartialBy<E['config'], 'origin' | 'defaultTextureName'>,
        state: StrictOmit<E['state'], 'textureName' | 'innerState'>
    ) {
        return new this(
            {
                origin: 'top-left',
                defaultTextureName: 'common',
                ...config,
            },
            {
                textureName: 'common',
                innerState: placeholder,
                ...state,
            }
        )
    }

    static createTextureFromImage<E extends TextureEntity = TextureEntity>(
        this: TextureEntityCtor<E>,
        src: string,
        config: PartialBy<E['config'], 'origin' | 'textures' | 'defaultTextureName'>,
        state: StrictOmit<E['state'], 'textureName' | 'innerState'>
    ) {
        return this.createTexture(
            {
                textures: {
                    common: {
                        type: 'image',
                        src,
                    },
                },
                ...config,
            } as PartialBy<E['config'], 'origin' | 'defaultTextureName'>,
            state
        )
    }

    static createButtonFromImage<E extends TextureEntity = TextureEntity>(
        this: TextureEntityCtor<E>,
        src: string,
        config: PartialBy<E['config'], 'origin' | 'textures' | 'defaultTextureName'>,
        state: StrictOmit<E['state'], 'textureName' | 'innerState'>
    ) {
        type Button = E extends TextureEntity<infer C, infer S, infer V>
            ? TextureEntity<C, S & { hovering: boolean }, V & ButtonEvents>
            : never

        const button = this
            .createTextureFromImage(src, config, state)
            .addComp(HoverableComp)
            .addComp(ButtonComp)
            .as<Button>()
            .on('mouseenter', () => button.state.hovering = true)
            .on('mouseleave', () => button.state.hovering = false)

        return button
    }

    async start() {
        await super.start()
        const { textures } = this.config

        for (const [ name, texture ] of Object.entries(textures)) {
            switch (texture.type) {
                case 'image': {
                    const img = await this.game.imageManager.loadImage(texture.src)
                    this.images[name] = img
                    break
                }
                case 'anime': {
                    const frames = await Promise.all(
                        texture.srcs.map(src => this.game.imageManager.loadImage(src))
                    )
                    this.frames[name] = frames
                    break
                }
            }
        }

        this.switchTexture(this.state.textureName)
    }

    initInnerState(textureName: string): TextureInnerState {
        const texture = this.config.textures[textureName]
        switch (texture.type) {
            case 'anime': return {
                type: 'anime',
                f: 0,
                af: 0,
                isPlaying: true,
                direction: 1,
            }
            case 'image': return {
                type: 'image',
            }
        }
    }

    get textureName() {
        return this.state.textureName
    }
    get texture() {
        return this.config.textures[this.textureName]
    }

    get size() {
        const { texture } = this
        switch (texture.type) {
            case 'image': {
                const img = this.images[this.textureName]
                return { width: img.width, height: img.height }
            }
            case 'anime': {
                const [ frame ] = this.frames[this.textureName]
                return { width: frame.width, height: frame.height }
            }
        }
    }

    get frame(): HTMLImageElement {
        const { texture } = this
        switch (texture.type) {
            case 'image':
                return this.images[this.textureName]
            case 'anime':
                return this.frames[this.textureName][this.getInnerState<'anime'>().af]
        }
    }

    switchTexture(name: string) {
        if (! (name in this.config.textures))
            this.error(`Texture '${ name }' does not exist.`)

        this.afterStart(
            () => this
                .removeComp([ RectShape, shape => shape.tag === 'boundary' ])
                .addComp(RectShape, {
                    ...this.size,
                    ...pick(this.config, [ 'origin' ]),
                }),
            true
        )

        this.state.textureName = name
        this.state.innerState = this.initInnerState(name)
    }

    getInnerState<T extends TextureInnerState['type']>() {
        return this.state.innerState as Extract<TextureInnerState, { type: T }>
    }

    render() {
        const rectShape = this.getComp(RectShape)
        if (! rectShape) return

        const { x, y, width, height } = rectShape.rect
        const { texture, textureName } = this

        switch (texture.type) {
            case 'image': {
                const img = this.images[textureName]
                this.game.ctx.drawImage(img, x, y, width, height)
                break
            }
            case 'anime': {
                const { af } = this.getInnerState<'anime'>()
                const frames = this.frames[textureName]
                this.game.ctx.drawImage(frames[af], x, y, width, height)
                break
            }
        }
    }

    update() {
        const { texture } = this

        switch (texture.type) {
            case 'image': break
            case 'anime': {
                const animeState = this.getInnerState<'anime'>()
                const { isPlaying, direction } = animeState
                if (! isPlaying) return

                if (++ animeState.f === texture.fpaf) {
                    this.emit('anime-finish')
                    animeState.f = 0
                    const frameCount = this.frames[this.textureName].length
                    const af = animeState.af += direction
                    if (af === frameCount || af === - 1)
                        animeState.af -= frameCount * direction
                }
                break
            }
        }
    }
}
