
import { Entity, EntityEvents, EntityState, isInRect } from '@/engine'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'
import { BoundaryComp } from '@/comps/Boundary'

export interface SlotConfig {}

export interface SlotState extends EntityState {}

export interface SlotEvents extends HoverableEvents, EntityEvents {}

export class SlotEntity<
    C extends SlotConfig = SlotConfig,
    S extends SlotState = SlotState,
    E extends SlotEvents = SlotEvents
> extends Entity<C, S, E> {
    readonly width = 80 + 2
    readonly height = 80 + 20 + 2

    constructor(config: C, state: S) {
        super(config, state)

        const { position: { x, y } } = this.state

        this
            .addComp(ShapeComp, point => isInRect(point, { x, y, width: this.width, height: this.height }))
            .addComp(HoverableComp)
            .addComp(BoundaryComp, this.width, this.height)
    }

    preRender() {
        super.preRender()

        const { ctx } = this.game
        const { position: { x, y } } = this.state

        this.addRenderJob(() => {
            ctx.strokeStyle = 'brown'
            ctx.strokeRect(x, y, this.width, this.height)
        }, 0)
    }
}
