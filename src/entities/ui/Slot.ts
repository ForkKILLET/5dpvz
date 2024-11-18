
import { Entity, EntityEvents, EntityState } from '@/engine'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable.ts'
import { ShapeComp } from '@/comps/Shape.ts'
import { BoundaryComp } from '@/comps/Boundary.ts'

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

        this
            .addComp(BoundaryComp, () => this)
            .addComp(ShapeComp, point => this.getComp(BoundaryComp)!.contains(point))
            .addComp(HoverableComp)
    }

    preRender() {
        super.preRender()

        const { ctx } = this.game

        this.addRenderJob(() => {
            ctx.strokeStyle = 'brown'
            const { x, y, width, height } = this.getComp(BoundaryComp)!.rect
            ctx.strokeRect(x, y, width, height)
        }, 0)
    }
}
