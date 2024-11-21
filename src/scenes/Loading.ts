import { Scene } from '@/engine'
import { LoadingEntity } from '@/entities/Loading'

import { StartScene } from '@/scenes/Start'

export class LoadingScene extends Scene {
    constructor() {
        const loading = new LoadingEntity(
            {},
            { position: { x: 0, y: 0 }, zIndex: 5 }
        )

        super([ loading ])

        loading.on('load', () => {
            this.game.addScene(new StartScene())
        })
    }
}
