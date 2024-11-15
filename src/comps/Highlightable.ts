import { Comp, Entity } from '@/engine'

export class HighlightableComp extends Comp {
    highlighting = false

    constructor(entity: Entity, public filter = 'brightness(1.5)') {
        super(entity)

        entity.on('before-render', () => {
            if (this.highlighting) entity.game.ctx.filter = this.filter
        })
    }
}
