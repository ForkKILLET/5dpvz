import { Comp, CompCtor, CompEvents, Entity } from '@/engine'
import { ShapeComp } from '@/comps/Shape'
import { eq, remove, placeholder, elem } from '@/utils'
import { getProcessId } from '@/entities/Process'

export type CollidableGroup = 'plant' | 'zombie' | 'bullet'

export type TargetFilter =
| {
    ty: 'and'
    filters: TargetFilter[]
}
| {
    ty: 'or'
    filters: TargetFilter[]
}
| {
    ty: 'not'
    filter: TargetFilter
}
| {
    ty: 'has'
    group: CollidableGroup
}
| {
    ty: 'has-some'
    groups: CollidableGroup[]
}
| {
    ty: 'has-all'
    groups: CollidableGroup[]
}

export interface CollidableConfig {
    groups: CollidableGroup[]
    target: TargetFilter
    crossProcess?: boolean
}

export interface CollidableState {}

export interface CollidableEvents extends CompEvents {
    collide: [ Entity ]
}

export class CollidableComp extends Comp<CollidableConfig, CollidableState, CollidableEvents> {
    static dependencies = [ ShapeComp.withTag(elem('hitbox', 'texture')) ]

    static collidableComps: CollidableComp[] = []

    shape: ShapeComp = placeholder

    constructor(entity: Entity, config: CollidableConfig) {
        super(entity, config, {})

        this.emitter.on('attach', () => {
            this.shape = entity.getComp(ShapeComp.withTag(elem('hitbox', 'texture')))!

            CollidableComp.collidableComps.push(this)
            entity.on('dispose', () => {
                remove(CollidableComp.collidableComps, eq(this))
            })
        })
    }

    static create<M extends Comp>(this: CompCtor<M>, entity: Entity, config: CollidableConfig) {
        return new this(entity, config, {})
    }

    update() {
        for (const otherComp of CollidableComp.collidableComps) {
            if (! this.shouldCollideWith(otherComp)) continue
            if (this.shape.intersects(otherComp.shape)) {
                this.emitter.emit('collide', otherComp.entity)
                otherComp.emitter.emit('collide', this.entity)
            }
        }
    }

    shouldCollideWith(target: CollidableComp) {
        if (target === this) return false
        if (! this.config.crossProcess && getProcessId(target.entity) !== getProcessId(this.entity)) return false
        const taregtGroups = target.config.groups
        const _filter = (filter: TargetFilter): boolean => {
            switch (filter.ty) {
                case 'and': return filter.filters.every(_filter)
                case 'or': return filter.filters.some(_filter)
                case 'not': return ! _filter(filter.filter)
                case 'has': return taregtGroups.includes(filter.group)
                case 'has-some': return filter.groups.some(group => taregtGroups.includes(group))
                case 'has-all': return filter.groups.every(group => taregtGroups.includes(group))
            }
        }
        return _filter(this.config.target)
    }
}

Object.assign(window, { CollidableComp })
