import { Scene } from '@/engine'
import { LevelEntity } from '@/entities/Level'
import { Stage1_1 } from '@/data/stages.ts'

export class PlayScene extends Scene {
    constructor() {
        const level = new LevelEntity(
            {
                plantSlots: {
                    slotNum: 2,
                    plantIds: [ 'pea_shooter', 'sunflower' ],
                },
                lawn: {
                    width: 9,
                    height: 5,
                },
                sun: {
                    sunDroppingInterval: 10000,
                    firstSunDroppingTime: 6000,
                    sunDroppingVelocity: 30 / 1000,
                    sunLife: 8000,
                    sunAtStart: 200,
                },
                shovelSlot: {
                    shovelId: 'iron_shovel',
                },
                stage: Stage1_1,
            },
            LevelEntity.initState({
                position: { x: 0, y: 0 },
                zIndex: 0,
                stage: Stage1_1,
            })
        )

        super([
            level,
        ])
    }
}
