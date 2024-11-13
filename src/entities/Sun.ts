import { LifeComp } from '@/comps/Life'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'

interface SunUniqueConfig {
    life: number
    targetY: number
}
interface SunConfig extends SunUniqueConfig, ButtonConfig {}

interface SunUniqueState {}
interface SunState extends SunUniqueState, ButtonState {}

interface SunEvents extends ButtonEvents {}

export class SunEntity extends ButtonEntity<SunConfig, SunState, SunEvents> {
    constructor(config: SunUniqueConfig, state: SunState) {
        super({
            ...config,
            src: './assets/sun.png',
            containingMode: 'rect'
        }, state)

        this.addComp(new LifeComp(config.life))
    }
}