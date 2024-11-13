import { Scene } from '@/engine'
import { LevelEntity } from '@/entities/Level'

export class PlayScene extends Scene {
    constructor() {
        super([
            new LevelEntity(
                {
                    plantSlots: {
                        slotNum: 2,
                        plantIds: [ 'pea_shooter', 'pea_shooter' ]
                    },
                    lawn: {
                        width: 9,
                        height: 5
                    },
                    sunDropInterval: 10000
                },
                LevelEntity.initState({
                    position: { x: 0, y: 0 },
                    zIndex: 0
                })
            )
        ])
    }
}