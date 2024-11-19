import { Comp, Emitter, Entity, Events } from '@/engine'
import { CollidableGroup } from '@/data/collidableGroups'
import { ShapeComp } from '@/comps/Shape'
import { eq, remove, intersect } from '@/utils'

export interface CollidableEvents extends Events {
    collide: [ Entity ]
}

export interface CollidableConfig {
    groups: Set<CollidableGroup>
    targetGroups: Set<CollidableGroup>
    onCollision: (otherEntity: Entity) => void
}

export class CollidableComp<E extends Entity = Entity> extends Comp<E> {
    static dependencies = [ ShapeComp ]

    static collidableComps: CollidableComp[] = []

    shape: ShapeComp

    emitter = new Emitter<CollidableEvents>()

    constructor(entity: E, public config: CollidableConfig) {
        super(entity)

        this.shape = entity.getComp(ShapeComp)!

        CollidableComp.collidableComps.push(this)
        entity.on('dispose', () => remove(CollidableComp.collidableComps, eq(this)))
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

    shouldCollideWith(target: CollidableComp): boolean {
        if (target === this) return false
        return intersect(this.config.targetGroups, target.config.groups).size > 0
    }
}
