import { Scene } from '@/engine'
import { LevelEntity } from '@/entities/Level'
import { Stage1_1 } from '@/data/stages'

export class PlayScene extends Scene {
    constructor() {
        const level = LevelEntity.create(
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
                    sunDroppingInterval: 10_000,
                    firstSunDroppingTime: 6_000,
                    sunDroppingVelocity: 30 / 1000,
                    sunLife: 8000,
                    sunAtStart: 200,
                },
                shovelSlot: {
                    shovelId: 'iron_shovel',
                },
                stage: Stage1_1,
                bgm: 'day',
            },
            {
                position: { x: 0, y: 0 },
                zIndex: 0,
            }
        )

        super([
            level,
        ])
    }
}
