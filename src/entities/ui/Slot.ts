
import { Entity, EntityConfig, EntityCtor, EntityEvents, EntityState } from '@/engine'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { RectShape } from '@/comps/Shape'
import { StrictOmit } from '@/utils'

export interface SlotConfig extends EntityConfig {}

export interface SlotState extends EntityState {}

export interface SlotEvents extends HoverableEvents, EntityEvents {}

export class SlotEntity<
    C extends SlotConfig = SlotConfig,
    S extends SlotState = SlotState,
    V extends SlotEvents = SlotEvents
> extends Entity<C, S, V> {
    static readonly size = {
        width: 80 + 2,
        height: 80 + 20 + 2,
    }

    constructor(config: C, state: S) {
        super(config, state)

        this
            .addComp(RectShape, SlotEntity.size)
            .addComp(HoverableComp)
    }

    static createSlot<E extends SlotEntity = SlotEntity>(
        this: EntityCtor<E>,
        config: E['config'],
        state: StrictOmit<E['state'], 'size'>
    ) {
        return new this(config, { size: SlotEntity.size, ...state })
    }

    preRender() {
        super.preRender()

        const { ctx } = this

        this.addRenderJob(() => {
            const { width, height } = SlotEntity.size
            ctx.strokeStyle = 'brown'
            ctx.strokeRect(0, 0, width, height)
        }, 0)
    }
}
