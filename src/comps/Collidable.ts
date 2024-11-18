import { Comp, Entity } from '@/engine'
import { CollidableGroup } from '@/data/collidableGroups'
import { Shape } from '@/comps/Shape'

export class CollidableComp<E extends Entity = Entity> extends Comp<E> {
    static collisionComps: CollidableComp[] = []

    constructor(
        entity: E,
        public shape: Shape,
        public groups: CollidableGroup[],
        public collidesWith: CollidableGroup[],
        public onCollision: (otherEntity: Entity) => void
    ) {
        super(entity)
        CollidableComp.collisionComps.push(this)
    }

    // destroy() {
    //     const index = CollidableComp.collisionComps.indexOf(this)
    //     if (index !== -1) {
    //         CollidableComp.collisionComps.splice(index, 1)
    //     }
    //     super.destroy()
    // }

    update() {
        for (const otherComp of CollidableComp.collisionComps) {
            if (otherComp === this) continue
            if (! this.shouldCollideWith(otherComp)) continue
            if (this.shape.intersects(otherComp.shape)) {
                this.onCollision(otherComp.entity)
                if (otherComp.onCollision) {
                    otherComp.onCollision(this.entity)
                }
            }
        }
    }

    shouldCollideWith(otherComp: CollidableComp): boolean {
        return this.collidesWith.some(group => otherComp.groups.includes(group))
    }
}
