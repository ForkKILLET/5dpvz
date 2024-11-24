import { BULLETS } from '@/data/bullets'
import { PLANTS } from '@/data/plants'
import { Comp, CompCtor } from '@/engine'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { kProcess } from '@/entities/Process'
import { PlantEntity } from '@/entities/plants/Plant'
import { remove } from '@/utils'

void PLANTS
void BULLETS

export class BulletShootingBehavior<E extends PlantEntity = PlantEntity> extends Comp<{}, {}, E> {
    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity']) {
        return new this(entity, {}, {})
    }

    shootBullet(bullet: BulletEntity) {
        const process = this.entity.inject(kProcess)!
        const { bulletsData } = process.state

        bullet
            .on('dispose', () => {
                remove(bulletsData, ({ entity }) => bullet.id === entity.id)
            })
            .attachTo(process)

        bulletsData.push({ id: bullet.config.metadata.id, entity: bullet })
    }
}
