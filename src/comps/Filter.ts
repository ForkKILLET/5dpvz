import { Comp, Entity } from '@/engine'
import { neq, Nullable } from '@/utils'

export class FilterComp extends Comp {
    constructor(entity: Entity, public filters: Record<string, Nullable<string>> = {}) {
        super(entity)

        entity.on('before-render', () => {
            entity.game.ctx.filter = Object
                .values(this.filters)
                .filter(neq(null))
                .join(' ') || 'none'
        })
    }
}
