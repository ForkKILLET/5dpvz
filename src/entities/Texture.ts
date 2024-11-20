import { OriginConfig, RectShape } from '@/comps/Shape'
import { EntityEvents, EntityState, Entity } from '@/engine'

export type Texture =
    | { type: 'Animation', srcs: string[], fpaf: number }
    | { type: 'Image', src: string }

export type TextureSet = Record<string, Texture>

export interface TextureConfig extends OriginConfig {
    textures: TextureSet
    defaultTextureName: string
}

export interface TextureState extends EntityState {
    f?: number
    af?: number
    isPlaying?: boolean
    direction?: 1 | - 1
    currentTextureName?: string
}

export interface TextureEvents extends EntityEvents {
    'animation-finish': []
}

export class TextureEntity<
    C extends TextureConfig = TextureConfig,
    S extends TextureState = TextureState,
    E extends TextureEvents = TextureEvents
> extends Entity<C, S, E> {
    textures: TextureSet
    currentTextureName: string

    images: Record<string, HTMLImageElement> = {}
    frames: Record<string, HTMLImageElement[]> = {}

    fpaf: number = 1

    constructor(config: C, state: S) {
        super(config, state)
        this.textures = config.textures
        this.currentTextureName = config.defaultTextureName
        this.state.currentTextureName = this.currentTextureName

        this.state.f = this.state.f ?? 0
        this.state.af = this.state.af ?? 0
        this.state.isPlaying = this.state.isPlaying ?? true
        this.state.direction = this.state.direction ?? 1
    }

    async start() {
        await super.start()
        const { textures } = this.config

        for (const [ name, texture ] of Object.entries(textures)) {
            if (texture.type === 'Image') {
                const img = await this.game.imageManager.loadImage(texture.src)
                this.images[name] = img
            }
            else if (texture.type === 'Animation') {
                const imgs = await Promise.all(
                    texture.srcs.map(src => this.game.imageManager.loadImage(src))
                )
                this.frames[name] = imgs
            }
        }

        this.changeTexture(this.currentTextureName)
    }

    changeTexture(name: string) {
        if (! (name in this.textures)) {
            throw new Error(`Texture "${ name }" does not exist`)
        }
        this.currentTextureName = name
        this.state.currentTextureName = name

        const texture = this.textures[name]

        if (texture.type === 'Image') {
            const img = this.images[name]
            const { width, height } = img
            const rect = this.getComp(RectShape)
            if (rect) {
                rect.config.width = width
                rect.config.height = height
            }
            else {
                this.addComp(RectShape, { width, height, origin: this.config.origin })
            }
        }
        else if (texture.type === 'Animation') {
            this.fpaf = texture.fpaf
            this.state.f = 0
            this.state.af = 0
            const frame = this.frames[name][0]
            const { width, height } = frame
            const rect = this.getComp(RectShape)
            if (rect) {
                rect.config.width = width
                rect.config.height = height
            }
            else {
                this.addComp(RectShape, { width, height, origin: this.config.origin })
            }
            this.state.isPlaying = true
            this.state.direction = 1
        }
    }

    render() {
        const rectShape = this.getComp(RectShape)
        if (! rectShape) return

        const { x, y, width, height } = rectShape.rect
        const texture = this.textures[this.currentTextureName]

        if (texture.type === 'Image') {
            const img = this.images[this.currentTextureName]
            this.game.ctx.drawImage(img, x, y, width, height)
        }
        else if (texture.type === 'Animation') {
            const { af = 0 } = this.state
            const frames = this.frames[this.currentTextureName]
            const frame = frames[af]
            this.game.ctx.drawImage(frame, x, y, width, height)
        }
    }

    update() {
        const texture = this.textures[this.currentTextureName]

        if (texture.type === 'Animation') {
            const { isPlaying = true, direction = 1 } = this.state
            if (! isPlaying) return
            if (++ this.state.f! >= this.fpaf) {
                this.emit('animation-finish')
                this.state.f = 0
                const frames = this.frames[this.currentTextureName]
                const frameCount = frames.length
                const af = this.state.af! + direction
                if (af >= frameCount) {
                    this.state.af = 0
                }
                else if (af < 0) {
                    this.state.af = frameCount - 1
                }
                else {
                    this.state.af = af
                }
            }
        }
    }
}
