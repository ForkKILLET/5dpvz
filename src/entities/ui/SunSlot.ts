import { kProcess } from '@/entities/Process'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/ui/Slot'
import { TextureEntity } from '../Texture'

export interface SunSlotConfig extends SlotConfig {}

export interface SunSlotState extends SlotState {}

export interface SunSlotEvents extends SlotEvents {}

export class SunSlotEntity extends SlotEntity<SunSlotConfig, SunSlotState, SunSlotEvents> {
    sumImage: TextureEntity

    constructor(config: SunSlotConfig, state: SunSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.sumImage = TextureEntity.createTextureFromImage(
            './assets/sun.png',
            {},
            {
                position: { x: x + 1, y: y + 1 },
                zIndex: zIndex + 1,
            },
        )
        this.attach(this.sumImage)
    }

    render() {
        const { sun } = this.inject(kProcess)!.state

        const { ctx } = this.game
        const { position: { x, y } } = this.state

        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.font = '20px Sans'
        const sunString = String(sun)
        ctx.fillText(sunString, x + 1 + 80 / 2, y + 1 + 80 + 20 - 2)
    }
}
