import { Scene } from '@/engine'
import { LoadingEntity } from '@/entities/Loading'

import { StartScene } from '@/scenes/Start'

export class LoadingScene extends Scene {
    constructor() {
        super()

        const loading = LoadingEntity.createLoading().attachTo(this)

        loading.on('load', () => {
            this.game.addScene(new StartScene())
        })
    }
}
