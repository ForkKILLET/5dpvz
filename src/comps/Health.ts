import { Comp, CompCtor, Emitter, Entity, Events } from '@/engine'
import { FilterComp } from '@/comps/Filter'

export interface HealthEvents extends Events {
    takeDamage: [ number ]
    die: []
}

export interface HealthConfig {
    maxHp: number
}

export interface HealthState {
    hp: number
}

export class HealthComp<E extends Entity = Entity> extends Comp<HealthConfig, HealthState, E> {
    emitter = new Emitter<HealthEvents>()

    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], maxHp: number) {
        return new this(entity, { maxHp }, { hp: maxHp })
    }

    takeDamage(damage: number) {
        this.state.hp -= damage
        this.emitter.emit('takeDamage', damage)
        if (this.state.hp <= 0) {
            this.emitter.emit('die')
            this.entity.dispose()
        }
    }
}

export interface DamageEffectConfig {
    duration: number
}

export interface DamageEffectState {
    damageEffectTimer: number
}

export class DamageEffectComp extends Comp<DamageEffectConfig, DamageEffectState> {
    static readonly dependencies = [ HealthComp, FilterComp ]

    static readonly damageEffectDuration = 200

    constructor(entity: Entity, config: DamageEffectConfig, state: DamageEffectState) {
        super(entity, config, state)

        entity.withComps([ HealthComp, FilterComp ], (health, filter) => {
            health.emitter.on('takeDamage', () => {
                this.state.damageEffectTimer = 0
                filter.state.filters.damageEffect = 'brightness(1.2)'
            })
        })
    }

    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], duration = 100): M {
        return new this(entity, { duration }, {})
    }

    update() {
        this.updateTimer(
            'damageEffectTimer',
            { interval: this.config.duration, once: true },
            () => this.entity.withComp(FilterComp, filter => {
                filter.state.filters.damageEffect = null
            })
        )
    }
}

export interface ContinuousDamagingConfig {
    damagePF: number
}

export interface ContinuousDamagingState {
    targets: Set<Entity>
}

export class ContinuousDamagingComp extends Comp<ContinuousDamagingConfig, ContinuousDamagingState> {
    static create<M extends Comp>(this: CompCtor<M>, entity: Entity, damagePF: number) {
        return new this(entity, { damagePF }, { targets: new Set() })
    }

    update() {
        this.state.targets.forEach(target => {
            target.withComp(HealthComp, health => health.takeDamage(this.config.damagePF))
        })
    }
}

