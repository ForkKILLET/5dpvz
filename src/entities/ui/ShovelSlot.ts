import { shovelTextures, SHOVELS, ShovelId, ShovelMetadata } from '@/data/shovels'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/ui/Slot'
import { kProcess } from '@/entities/Process'
import { CursorComp } from '@/comps/Cursor'
import { TextureEntity } from '@/entities/Texture'
import { StrictOmit } from '@/utils'

export interface ShovelSlotConfig extends SlotConfig {
    shovelId: ShovelId
}

export interface ShovelSlotState extends SlotState {}

export interface ShovelSlotEvents extends SlotEvents {}

export class ShovelSlotEntity extends SlotEntity<ShovelSlotConfig, ShovelSlotState, ShovelSlotEvents> {
    shovelMetadata: ShovelMetadata
    shovelImage?: TextureEntity

    constructor(config: ShovelSlotConfig, state: ShovelSlotState) {
        super(config, state)

        const { pos: { x, y }, zIndex } = this.state

        this.shovelMetadata = SHOVELS[this.config.shovelId]

        this.shovelImage = TextureEntity.createTextureFromImage(
            shovelTextures.getImageSrc(this.config.shovelId),
            {},
            {
                pos: { x: x + 1, y: y + 1 },
                zIndex: zIndex + 2,
            },
        )

        this
            .attach(this.shovelImage)
            .addComp(CursorComp, 'pointer')
    }

    static createShovelSlot(config: ShovelSlotConfig, state: StrictOmit<SlotState, 'size'>) {
        return ShovelSlotEntity.createSlot(config, state)
    }

    preRender() {
        super.preRender()

        const { holdingObject } = this.inject(kProcess)!.state
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
