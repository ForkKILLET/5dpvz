import { Scene } from '@/engine'
import { LevelEntity } from '@/entities/Level'
import {getShovelAnimationConfig, SHOVEL_METADATA} from "@/data/shovel.ts";

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
                    sun: {
                        sunDroppingInterval: 10000,
                        firstSunDroppingTime: 6000,
                        sunDroppingVelocity: 30,
                        sunLife: 8000,
                        sunAtStart: 200
                    },
                    shovel: {
                        shovelId: "iron_shovel",
                        srcs, fpsf = getShovelAnimationConfig("iron_shovel")

                    }
                },
                LevelEntity.initState({
                    position: { x: 0, y: 0 },
                    zIndex: 0
                })
            )
        ])
    }
}
