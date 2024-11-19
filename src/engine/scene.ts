import { FullscreenShape } from '@/comps/Shape'
import { Entity, EntityEvents, EntityState } from '@/engine'

export class Scene extends Entity<{}, EntityState, EntityEvents> {
    constructor(entities: Entity[]) {
        super({}, { position: { x: 0, y: 0 }, zIndex: 0 })

        this
            .attach(...entities)
            .afterStart(() => this.addComp(FullscreenShape))
    }
}
