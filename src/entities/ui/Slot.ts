
import { Entity, EntityConfig, EntityEvents, EntityState } from '@/engine'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { RectShape } from '@/comps/Shape'

export interface SlotConfig extends EntityConfig {}

export interface SlotState extends EntityState {}

export interface SlotEvents extends HoverableEvents, EntityEvents {}

export class SlotEntity<
    C extends SlotConfig = SlotConfig,
    S extends SlotState = SlotState,
    V extends SlotEvents = SlotEvents
> extends Entity<C, S, V> {
    readonly width = 80 + 2
    readonly height = 80 + 20 + 2

    constructor(config: C, state: S) {
        super(config, state)

        this
            .addComp(RectShape, { width: this.width, height: this.height, origin: 'top-left' })
            .addComp(HoverableComp)
    }

    preRender() {
        super.preRender()

        const { ctx } = this.game

        this.addRenderJob(() => {
            ctx.strokeStyle = 'brown'
            const { x, y, width, height } = this.getComp(RectShape)!.rect
            ctx.strokeRect(x, y, width, height)
        }, 0)
    }
}
