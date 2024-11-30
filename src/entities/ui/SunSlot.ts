import { kProcess } from '@/entities/Process'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/ui/Slot'
import { TextureEntity } from '../Texture'
import { TransitionComp } from '@/comps/Transition'
import { easeInSine } from '@/engine'
import { placeholder, StrictOmit } from '@/utils'

export interface SunSlotConfig extends SlotConfig {}

export interface SunSlotState extends SlotState {}

export interface SunSlotEvents extends SlotEvents {}

export class SunSlotEntity extends SlotEntity<SunSlotConfig, SunSlotState, SunSlotEvents> {
    sunImage: TextureEntity = placeholder

    constructor(config: SunSlotConfig, state: SunSlotState) {
        super(config, state)
    }

    static createSunSlot(state: StrictOmit<SunSlotState, 'size'>) {
        return SunSlotEntity.createSlot({}, state)
    }

    build() {
        const { pos: { x, y }, zIndex } = this.state

        this.sunImage = this.useBuilder('SunImage', () => TextureEntity
            .createTextureFromImage(
                './assets/sun.png',
                {
                    origin: 'center',
                },
                {
                    pos: { x: x + 1 + 40, y: y + 1 + 40 },
                    zIndex: zIndex + 1,
                    scale: 1,
                },
            ))
            .addComp(TransitionComp, {
                transition: (image, t) => {
                    image.state.scale = 1 + 0.3 * easeInSine(t)
                },
                defaultTotalFrame: this.game.unit.ms2f(200),
            })
    }

    render() {
        const { sun } = this.inject(kProcess)!.state

        const { ctx } = this

        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.font = '20px Sans'
        const sunString = String(sun)
        ctx.fillText(sunString, 1 + 80 / 2, 1 + 80 + 20 - 2)
    }
}
