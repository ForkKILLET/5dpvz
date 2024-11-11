import { createIdGenerator, Entity, Game } from '@/engine'
import { by } from '@/utils'

export abstract class Scene {
    static generateSceneId = createIdGenerator()

    readonly id = Scene.generateSceneId()

    active = false
    activate() {
        this.active = true
        return this
    }
    deactivate() {
        this.active = false
        return this
    }

    constructor(public entities: Entity<any, any, any>[]) {}

    render() {
        this.entities
            .sort(by(entity => entity.state.zIndex))
            .forEach(entity => {
                entity.runUpdate()
                entity.runRender()
            })
    }

    game: Game = null as any
    async start(game: Game): Promise<void> {
        await Promise.all(this.entities.map(entity => entity.start(game)))
        this.game = game
    }

    dispose() {
        this.entities.forEach(entity => entity.dispose())
    }
}
