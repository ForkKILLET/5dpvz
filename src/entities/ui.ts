import { EntityEvents, EntityState, Entity } from '@/engine'
import { PlantSlotEntity } from '@/entities/plantSlot'
import { PlantName } from '@/data/plants'
import { SunSlotEntity } from './sunSlot'

export interface PlantSlotsConfig {
    slotNum: number
    plantNames: PlantName[]
}

export interface UIConfig extends PlantSlotsConfig {}

export interface UIState extends EntityState {}

export interface UIEvents extends EntityEvents {
    'choose-plant': [ [ slotId: number ], void ]
}

export class UIEntity extends Entity<UIConfig, UIState, UIEvents> {
    sunSlot: SunSlotEntity
    plantSlots: PlantSlotEntity[]

    constructor(config: UIConfig, state: UIState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.sunSlot = new SunSlotEntity({},
            {
                position: { x, y },
                zIndex: zIndex + 1
            }
        ).enableAutoRender()
        this.plantSlots = this.config.plantNames.map((plantName, i) => (
            new PlantSlotEntity(
                {
                    plantName,
                    slotId: i
                },
                {
                    position: { x: x + (i + 1) * (80 + 2 + 5), y },
                    zIndex: zIndex + 1,
                }
            )
                .enableAutoRender()
                .on('click', () => {
                    this.emit('choose-plant', i)
                })
        ))
        this.delegate([ this.sunSlot, ...this.plantSlots ])
    }
}