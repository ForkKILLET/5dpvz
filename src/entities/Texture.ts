import { ButtonComp, ButtonLikeEvents } from '@/comps/Button'
import { HoverableComp } from '@/comps/Hoverable'
import { AnyShape, OriginConfig, RectShape, ShapeComp } from '@/comps/Shape'
import { TextureSet } from '@/data/textures'
import {
    Entity, EntityConfig, EntityCtor, EntityEvents, EntityState,
    getImageOutline, getImagePixels, Outline, vAdd,
    InputNode,
} from '@/engine'
import { Direction, elem, PartialBy, pick, placeholder, StrictOmit } from '@/utils'

export type TextureInnerState =
    | {
        type: 'anime'
        f: number
        af: number
        isPlaying: boolean
        direction: Direction
    }
    | {
        type: 'image'
    }

export interface TextureConfig extends OriginConfig, EntityConfig {
    textures: TextureSet
    defaultTextureName: string
    strictShape?: boolean
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
    frames: Record<
        string,
        { images: HTMLImageElement[], imageData: ImageData[] }
    > = {}
    offScreenCanvas: HTMLCanvasElement = document.createElement('canvas')
    offScreenCtx: CanvasRenderingContext2D = this.offScreenCanvas.getContext('2d')!

    constructor(config: C, state: S) {
        super(config, state)
        this.state.textureName ??= config.defaultTextureName
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
            state,
        )
    }

    static createButtonFromImage<E extends TextureEntity = TextureEntity>(
        this: TextureEntityCtor<E>,
        src: string,
        config: PartialBy<E['config'], 'origin' | 'textures' | 'defaultTextureName'>,
        state: StrictOmit<E['state'], 'textureName' | 'innerState'>
    ) {
        type Button = E extends TextureEntity<infer C, infer S, infer V>
            ? TextureEntity<C, S & { hovering: boolean }, V & ButtonLikeEvents>
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

    pixels: Record<string, Uint8ClampedArray[]> = {}
    outlines: Record<string, Outline[]> = {}

    async start() {
        await super.start()
        const { textures, strictShape } = this.config

        for (const [ name, texture ] of Object.entries(textures)) {
            switch (texture.type) {
                case 'image': {
                    const img = await this.game.imageManager.loadImage(texture.src)
                    const imageData = this.getImageDataFromImage(img)
                    this.frames[name] = {
                        images: [ img ],
                        imageData: [ imageData ],
                    }
                    if (strictShape) {
                        const pixels = getImagePixels(img)
                        this.pixels[name] = [ pixels ]
                        this.outlines[name] = [ getImageOutline(img, pixels) ]
                    }
                    break
                }
                case 'anime': {
                    const images = await Promise.all(
                        texture.srcs.map(src => this.game.imageManager.loadImage(src))
                    )
                    const imageData = images.map(img => this.getImageDataFromImage(img))
                    this.frames[name] = {
                        images,
                        imageData,
                    }
                    if (strictShape) {
                        this.pixels[name] = images.map(getImagePixels)
                        this.outlines[name] = images.map((frame, i) => getImageOutline(frame, this.pixels[name][i]))
                    }
                    break
                }
            }
        }

        if (this.state.innerState === placeholder) this.switchTexture(this.state.textureName)

        const sourceNode = new InputNode(this)
        this.pipeline.setStartNode(sourceNode)
    }

    getImageDataFromImage(img: HTMLImageElement): ImageData {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        return ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    getFrameImageData(frameIndex: number): ImageData {
        return this.frames[this.textureName].imageData[frameIndex]
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

    get f() {
        switch (this.texture.type) {
            case 'image':
                return 0
            case 'anime':
                return this.getInnerState<'anime'>().af
        }
    }
    get currentFrameImageData(): ImageData {
        return this.frames[this.textureName].imageData[this.f]
    }
    get size() {
        return pick(this.currentFrameImageData, [ 'width', 'height' ])
    }

    switchTexture(name: string) {
        if (! (name in this.config.textures))
            this.error(`Texture '${ name }' does not exist.`)

        this.afterStart(
            () => {
                const shapeConfig = {
                    ...this.size,
                    ...pick(this.config, [ 'origin' ]),
                }
                this
                    .removeComp(ShapeComp.withTag(elem('texture', 'boundary')))
                    .addLoseComp(RectShape, {
                        tag: 'texture',
                        ...shapeConfig,
                    })

                if (this.config.strictShape)
                    this.addRawComp(AnyShape.create(this, {
                        tag: 'boundary',
                        contains(point) {
                            const rectShape = this.getComp(RectShape)!
                            if (! rectShape.contains(point)) return false
                            const { x, y, width } = rectShape.rect
                            const pixels = this.pixels[this.textureName][this.f]
                            const rx = point.x - x
                            const ry = point.y - y
                            const alpha = pixels[ry * width * 4 + rx * 4 + 3]
                            return alpha > 0
                        },
                        intersects() {
                            return false
                        },
                        stroke() {
                            const outline = this.outlines[this.textureName][this.f]
                            const { x, y } = this.getComp(RectShape)!.rect
                            outline.outline.forEach(dot => this.game.ctx.strokeRect(dot.x + x, dot.y + y, 1, 1))
                        },
                        fill() {
                            const outline = this.outlines[this.textureName][this.f]
                            const { x, y } = this.getComp(RectShape)!.rect
                            outline.inner.forEach(dot => this.game.ctx.fillRect(dot.x + x, dot.y + y, 1, 1))
                        },
                    }))
                else
                    this.addLoseComp(RectShape, shapeConfig)
            },
            true
        )

        this.state.textureName = name
        this.state.innerState = this.initInnerState(name)
    }

    getInnerState<T extends TextureInnerState['type']>() {
        return this.state.innerState as Extract<TextureInnerState, { type: T }>
    }

    async render() {
        const processedFrame = this.pipeline.getOutput(this.f)

        const rectShape = this.getComp(RectShape)!
        const position = pick(rectShape.rect, [ 'x', 'y' ])
        const offsetPosition = vAdd(position, processedFrame.offset)
        const { width, height } = processedFrame.imageData

        this.offScreenCanvas.width = width
        this.offScreenCanvas.height = height
        this.offScreenCtx.clearRect(0, 0, width, height)
        this.offScreenCtx.putImageData(processedFrame.imageData, 0, 0)

        this.game.ctx.drawImage(
            this.offScreenCanvas,
            offsetPosition.x, offsetPosition.y,
            width, height
        )
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
                    const frameCount = this.frames[this.textureName].imageData.length
                    const af = animeState.af += direction
                    if (af === frameCount || af === - 1)
                        animeState.af -= frameCount * direction
                }
                break
            }
        }
    }
}
