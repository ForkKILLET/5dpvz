import { PLANTS } from '@/data/plants'
import { Comp, CompCtor, CompEvents } from '@/engine'
import { kProcess } from '@/entities/Process'
import { PlantEntity } from '@/entities/plants/Plant'

void PLANTS

export class ZombieSeekingComp<E extends PlantEntity = PlantEntity> extends Comp<{}, {}, CompEvents, E> {
    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity']) {
        return new this(entity, {}, {})
    }

    seekZombies(rows: number[], direction: 'front' | 'back') {
        const { zombiesData } = this.entity.inject(kProcess)!.state
        const { x } = this.entity.state.position

        return zombiesData.filter(({ entity: { state } }) => (
            rows.includes(state.j) &&
            (state.position.x >= x === (direction === 'front'))
        )).length > 0
    }
}
