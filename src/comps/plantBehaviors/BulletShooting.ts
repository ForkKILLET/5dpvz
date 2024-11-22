import { BULLETS } from '@/data/bullets'
import { PLANTS } from '@/data/plants'
import { Comp } from '@/engine'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { kLevel } from '@/entities/Level'
import { PlantEntity } from '@/entities/plants/Plant'
import { remove } from '@/utils'

void PLANTS
void BULLETS

export class BulletShootingBehavior<E extends PlantEntity = PlantEntity> extends Comp<E> {
    shootBullet(bullet: BulletEntity) {
        const level = this.entity.inject(kLevel)!
        const { bulletsData } = level.state

        bullet
            .on('dispose', () => {
                remove(bulletsData, ({ entity }) => bullet.id === entity.id)
            })
            .attachTo(level)

        bulletsData.push({ id: bullet.config.metadata.id, entity: bullet })
    }
}
