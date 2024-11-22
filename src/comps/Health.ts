import { Comp, Emitter, Entity, Events } from '@/engine'
import { FilterComp } from './Filter'

export interface HealthEvents extends Events {
    takeDamage: [ number ]
    die: []
}

export interface HealthConfig {
    hp: number
}

export class HealthComp<E extends Entity = Entity> extends Comp<E> {
    constructor(entity: E, public config: HealthConfig) {
        super(entity)
    }

    emitter = new Emitter<HealthEvents>()

    takeDamage(damage: number) {
        this.config.hp -= damage
        this.emitter.emit('takeDamage', damage)
        if (this.config.hp <= 0) {
            this.emitter.emit('die')
            this.entity.dispose()
        }
    }
}

export class DamageEffectComp<E extends Entity = Entity> extends Comp<E> {
    static readonly dependencies = [ HealthComp, FilterComp ]

    static readonly damageEffectDuration = 200

    damageEffectTimer = 0

    constructor(entity: E) {
        super(entity)
        entity.withComps([ HealthComp, FilterComp ], (health, filter) => {
            health.emitter.on('takeDamage', () => {
                // TODO: state API & timer API
                this.damageEffectTimer = DamageEffectComp.damageEffectDuration
                filter.filters.damageEffect = 'brightness(1.2)'
            })
        })
    }

    update() {
        if (this.damageEffectTimer) this.damageEffectTimer -= this.entity.game.mspf
        if (this.damageEffectTimer <= 0) {
            this.damageEffectTimer = 0
            this.entity.withComp(FilterComp, filter => {
                filter.filters.damageEffect = null
            })
        }
    }
}

export interface ContinuousDamageConfig {
    damagePF: number
}

export class ContinuousDamagingComp<E extends Entity = Entity> extends Comp<E> {
    targets: Set<Entity> = new Set()

    constructor(entity: E, public config: ContinuousDamageConfig) {
        super(entity)
    }

    update() {
        this.targets.forEach(target => target
            .withComp(HealthComp, health => health.takeDamage(this.config.damagePF))
        )
    }
}

