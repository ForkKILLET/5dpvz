import { isInRect } from '@/engine'
import { HoverableComp } from '@/comps/Hoverable'
import { shovelAnimation, SHOVEL_METADATA, ShovelId, ShovelMetadata } from '@/data/shovel'
import { ShapeComp } from '@/comps/Shape'
import { ImageEntity } from '@/entities/Image'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/Slot'

export interface ShovelSlotConfig extends SlotConfig {
    shovelId: ShovelId
}

export interface ShovelSlotState extends SlotState {}

export interface ShovelSlotEvents extends SlotEvents {}

export class ShovelSlotEntity extends SlotEntity<ShovelSlotConfig, ShovelSlotState, ShovelSlotEvents> {
    shovelMetadata: ShovelMetadata

    constructor(config: ShovelSlotConfig, state: ShovelSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this
            .addComp(new ShapeComp(point =>
                isInRect(point, { x, y, width: this.width, height: this.height }),
            ))
            .addComp(new HoverableComp())

        this.shovelMetadata = SHOVEL_METADATA[this.config.shovelId]

        this.afterStart(() => {
            this.attach(new ImageEntity(
                shovelAnimation.getImageConfig(this.config.shovelId),
                {
                    position: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2,
                },
            ))
        })
    }

    preRender() {
        super.preRender()

        // TODO
    }
}
