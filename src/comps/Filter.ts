import { Comp, CompCtor, Entity } from '@/engine'
import { neq, Nullable } from '@/utils'

export interface FilterConfig {}

export type FilterFilters = Record<string, Nullable<string>>

export interface FilterState {
    filters: FilterFilters
}

export class FilterComp extends Comp<FilterConfig, FilterState> {
    constructor(entity: Entity, config: FilterConfig, state: FilterState) {
        super(entity, config, state)
        entity.on('before-render', () => {
            this.game.ctx.filter = Object
                .values(this.state.filters)
                .filter(neq(null))
                .join(' ') || 'none'
        })
    }

    static create<M extends Comp>(this: CompCtor<M>, entity: Entity, filters: FilterFilters = {}) {
        return new this(entity, {}, { filters })
    }
}
