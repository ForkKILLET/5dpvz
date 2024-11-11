import { inRect, Game, getImagePixels, EntityEvents, ClickableEvents } from '@/engine'
import { ImageConfig, ImageEntity, ImageState } from '@/entities/image'

export interface ButtonConfig extends ImageConfig {}

export interface ButtonUniqueState {
    hovering: boolean
}
export interface ButtonState extends ImageState, ButtonUniqueState {}


export interface ButtonEvents extends ClickableEvents, EntityEvents {}

export class ButtonEntity<
    C extends ButtonConfig = ButtonConfig,
    S extends ButtonState = ButtonState,
    E extends ButtonEvents = ButtonEvents
> extends ImageEntity<C, S, E> {
    static initState = <S>(state: S): S & ButtonUniqueState => ({
        ...state,
        hovering: false
    })

    protected pixels: Uint8ClampedArray | null = null

    async start(game: Game) {
        await super.start(game)
        this.pixels = getImagePixels(this.img!)

        this.disposers.push(game.mouse.emitter.on('click', () => {
            if (this.isHovering) this.emitter.emit('click', this)
        }))
    }

    get isHovering() {
        const { x, y } = this.state.position
        const { mouse } = this.game
        const { width, height } = this.img!

        if (! inRect(mouse.position, { x, y, width, height })) return false
        const rx = mouse.position.x - x
        const ry = mouse.position.y - y
        const i = ry * width * 4 + rx * 4   
        const [ r, g, b, a ] = this.pixels!.slice(i, i + 4)
        return ! (r === 0 && g === 0 && b === 0 && a === 0)
    }

    render() {
        const { x, y } = this.state.position
        this.game.ctx.drawImage(this.img!, x, y)
    }

    update() {
        super.update()
        const hovering = this.isHovering
        if (hovering !== this.state.hovering) {
            this.emit(hovering ? 'mouseenter' : 'mouseleave')
        }
        this.state.hovering = hovering
        return this.state
    }
}