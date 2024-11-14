import { shovelAnimation, SHOVEL_METADATA, ShovelId, ShovelMetadata } from '@/data/shovel'
import { ImageEntity } from '@/entities/Image'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/Slot'
import {kLevelState} from "@/entities/Level.ts";

export interface ShovelSlotConfig extends SlotConfig {
    shovelId: ShovelId
}

export interface ShovelSlotState extends SlotState {}

export interface ShovelSlotEvents extends SlotEvents {}

export class ShovelSlotEntity extends SlotEntity<ShovelSlotConfig, ShovelSlotState, ShovelSlotEvents> {
    shovelMetadata: ShovelMetadata
    attachedImageEntity?: ImageEntity

    constructor(config: ShovelSlotConfig, state: ShovelSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.shovelMetadata = SHOVEL_METADATA[this.config.shovelId]

        this.afterStart(() => {
            const imageEntity = new ImageEntity(
                shovelAnimation.getImageConfig(this.config.shovelId),
                {
                    position: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2,
                }
            )
            this.attach(imageEntity)
            this.attachedImageEntity = imageEntity
        })
    }

    preRender() {
        super.preRender()

        const { holdingObject } = this.inject(kLevelState)!
        if (holdingObject?.type === 'shovel') {
            this.addRenderJob(() => {
                const attachedImageEntity = this.attachedImageEntity
                if (attachedImageEntity) {
                    attachedImageEntity.deactivate()
                }
            }, 2)
        }
    }
}
