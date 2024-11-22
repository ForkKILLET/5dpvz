import { PLANTS } from '@/data/plants'
import { Comp } from '@/engine'
import { kLevel } from '@/entities/Level'
import { PlantEntity } from '@/entities/plants/Plant'

void PLANTS

export class ZombieSeekingBehavior<E extends PlantEntity = PlantEntity> extends Comp<E> {
    seekZombies(rows: number[], direction: 'front' | 'back') {
        const { zombiesData } = this.entity.inject(kLevel)!.state
        const { x } = this.entity.state.position

        return zombiesData.filter(({ entity: { state } }) => (
            rows.includes(state.j) &&
            (state.position.x >= x === (direction === 'front'))
        )).length > 0
    }
}
