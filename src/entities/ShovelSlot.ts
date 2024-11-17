import { shovelAnimation, SHOVEL_METADATA, ShovelId, ShovelMetadata } from '@/data/shovel'
import { ImageEntity } from '@/entities/Image'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/Slot'
import { kLevelState } from '@/entities/Level'
import { CursorComp } from '@/comps/Cursor'

export interface ShovelSlotConfig extends SlotConfig {
    shovelId: ShovelId
}

export interface ShovelSlotState extends SlotState {}

export interface ShovelSlotEvents extends SlotEvents {}

export class ShovelSlotEntity extends SlotEntity<ShovelSlotConfig, ShovelSlotState, ShovelSlotEvents> {
    shovelMetadata: ShovelMetadata
    shovelImage?: ImageEntity

    constructor(config: ShovelSlotConfig, state: ShovelSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.shovelMetadata = SHOVEL_METADATA[this.config.shovelId]

        this
            .attach(this.shovelImage = ImageEntity.create(
                shovelAnimation.getImageConfig(this.config.shovelId),
                {
                    position: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2,
                },
            ))
            .addComp(CursorComp, 'pointer')
    }

    preRender() {
        super.preRender()

        const { holdingObject } = this.inject(kLevelState)!
        if (holdingObject?.type === 'shovel') {
            this.addRenderJob(() => {
                const attachedImageEntity = this.shovelImage
                if (attachedImageEntity) {
                    attachedImageEntity.deactivate()
                }
            }, 2)
        }
    }
}
