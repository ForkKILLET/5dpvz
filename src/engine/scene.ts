import { BoundaryComp } from '@/comps/Boundary'
import { Entity, EntityEvents, EntityState } from '@/engine'

export class Scene extends Entity<{}, EntityState, EntityEvents> {
    constructor(entities: Entity[]) {
        super({}, { position: { x: 0, y: 0 }, zIndex: 0 })

        this
            .attach(...entities)
            .afterStart(() => {
                const { width, height } = this.game.ctx.canvas
                this.addComp(BoundaryComp, width, height)
            })
    }
}
