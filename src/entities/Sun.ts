import { CursorComp } from '@/comps/Cursor'
import { LifeComp } from '@/comps/Life'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'
import { ImageEntity } from './Image'
import { EntityState } from '@/engine'

interface SunUniqueConfig {
    life: number
    targetY: number
}
interface SunConfig extends SunUniqueConfig, ButtonConfig {}

interface SunUniqueState {}
interface SunState extends SunUniqueState, ButtonState {}

interface SunEvents extends ButtonEvents {}

export class SunEntity extends ButtonEntity<SunConfig, SunState, SunEvents> {
    constructor(config: SunConfig, state: SunState) {
        super(config, state)
        this
            .addComp(LifeComp, config.life)
            .addComp(CursorComp, 'pointer')
    }

    static create(config: SunUniqueConfig, state: EntityState) {
        return SunEntity.from(
            new ImageEntity(
                { src: './assets/sun.png', containingMode: 'strict' },
                state
            ),
            {
                containingMode: 'rect',
                ...config,
            },
        )
    }
}
