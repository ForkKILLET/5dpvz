import { isInRect, Game, getImagePixels, EntityEvents } from '@/engine'
import { ImageConfig, ImageEntity, ImageState } from '@/entities/Image'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'

export interface ButtonConfig extends ImageConfig {
    containingMode: 'rect' | 'strict'
}

export interface ButtonUniqueState {
    hovering: boolean
}
export interface ButtonState extends ImageState, ButtonUniqueState {}


export interface ButtonEvents extends HoverableEvents, EntityEvents {}

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

    constructor(config: C, state: S) {
        super(config, state)

        const shapeComp = new ShapeComp((point) => {
            const { x, y } = this.state.position
            const { width, height } = this.img!

            if (! isInRect(point, { x, y, width, height })) return false
            if (this.config.containingMode === 'rect') return true
            
            const rx = point.x - x
            const ry = point.y - y
            const i = ry * width * 4 + rx * 4   
            const [ r, g, b, a ] = this.pixels!.slice(i, i + 4)
            return ! (r === 0 && g === 0 && b === 0 && a === 0)
        })
        const hoverableComp = new HoverableComp()

        this
            .addComp(shapeComp)
            .addComp(hoverableComp)
            .forwardEvents(hoverableComp.emitter, [ 'click', 'rightclick' ])
    }

    async start(game: Game) {
        await super.start(game)
        if (this.config.containingMode === 'strict') this.pixels = getImagePixels(this.img!)
    }

    render() {
        const { x, y } = this.state.position
        this.game.ctx.drawImage(this.img!, x, y)
    }

    update() {
        this.state.hovering = this.getComp(HoverableComp)!.hovering
        return this.state
    }
}