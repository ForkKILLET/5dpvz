import { FullscreenShape } from '@/comps/Shape'
import { Entity, EntityEvents, EntityState } from '@/engine'
import { pick, placeholder } from '@/utils'

export class Scene extends Entity<{}, EntityState, EntityEvents> {
    constructor() {
        super({}, {
            pos: { x: 0, y: 0 },
            size: placeholder,
            zIndex: 0,
        })

        this.state.size = pick(this.game.ctx.canvas, [ 'width', 'height' ])

        this.addComp(FullscreenShape)
    }
}
