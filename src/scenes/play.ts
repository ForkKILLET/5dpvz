import { Scene } from '@/engine'
import { AnimationEntity } from '@/entities/animation'
import { UIEntity } from '@/entities/ui'

export class PlayScene extends Scene {
    constructor() {
        const ui = new UIEntity(
            {
                slotNum: 2,
                plantNames: [ 'pea_shooter', 'pea_shooter' ]
            },
            UIEntity.initState({
                position: { x: 5, y: 5 },
                zIndex: 1
            })
        )

        const peaShooter = new AnimationEntity(
            {
                srcs: AnimationEntity.getStdSrcs('./assets/plants/pea_shooter', 12),
                fpsf: 8
            },
            AnimationEntity.initState({
                position: { x: 100, y: 100 },
                zIndex: 1
            })
        )

        super([
            ui,
            peaShooter
        ])
    }
}