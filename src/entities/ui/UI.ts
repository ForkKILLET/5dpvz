import { HoverableComp } from '@/comps/Hoverable'
import { RectShape } from '@/comps/Shape'
import { PlantId } from '@/data/plants'
import { ShovelId } from '@/data/shovels'
import { Entity, EntityConfig, EntityEvents, EntityState } from '@/engine'
import { PlantSlotEntity } from '@/entities/ui/PlantSlot'
import { ShovelSlotEntity } from '@/entities/ui/ShovelSlot'
import { SunSlotEntity } from '@/entities/ui/SunSlot'
import { placeholder, StrictOmit } from '@/utils'

export interface PlantSlotsConfig extends EntityConfig {
    slotNum: number
    plantIds: PlantId[]
}

export interface UIConfig extends PlantSlotsConfig {}

export interface UIState extends EntityState {}

export interface UIEvents extends EntityEvents {
    'choose-plant': [ slotId: number ]
    'choose-shovel': [ shovelId: ShovelId ]
}

export class UIEntity extends Entity<UIConfig, UIState, UIEvents> {
    sunSlot: SunSlotEntity = placeholder
    plantSlots: PlantSlotEntity[] = placeholder
    shovelSlot: ShovelSlotEntity = placeholder

    constructor(config: UIConfig, state: UIState) {
        super(config, state)

        this.state.size = {
            width: (this.config.slotNum + 2) * (80 + 2 + 5) - 5,
            height: 80 + 20 + 2,
        }
        this.addComp(RectShape, this.state.size)
    }

    static createUI(config: UIConfig, state: StrictOmit<UIState, 'size'>) {
        return new this(config, { ...state, size: placeholder })
    }

    build() {
        const { pos: { x, y }, zIndex } = this.state

        this.sunSlot = this
            .useBuilder('SunSlot', () => SunSlotEntity.createSunSlot({
                pos: { x, y },
                zIndex: zIndex + 1,
            }))
        this.plantSlots = this.config.plantIds.map((plantName, i) => this
            .useBuilder(`PlantSlot_${ i }`, () => PlantSlotEntity.createPlantSlot(
                {
                    plantId: plantName,
                    slotId: i,
                },
                {
                    pos: { x: x + (i + 1) * (80 + 2 + 5), y },
                    zIndex: zIndex + 1,
                },
            ))
            .withComp(HoverableComp, ({ emitter }) => {
                emitter.on('click', ({ stop }) => {
                    stop()
                    this.emit('choose-plant', i)
                })
            })
        )
        this.shovelSlot = this
            .useBuilder('ShovelSlot', () => ShovelSlotEntity.createShovelSlot(
                {
                    shovelId: 'iron_shovel',
                },
                {
                    pos: { x: x + (this.config.slotNum + 1) * (80 + 2 + 5), y },
                    zIndex: zIndex + 1,
                },
            ))
            .withComp(HoverableComp, hoverable => hoverable!.emitter.on('click', ({ stop }) => {
                stop()
                this.emit('choose-shovel', this.shovelSlot.config.shovelId)
            }))
    }
}
