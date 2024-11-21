import { Comp, Emitter, Entity, Events } from '@/engine'

export interface HealthEvents extends Events {
    takeDamage: [ number ]
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
        if (this.config.hp <= 0) {
            this.entity.dispose()
        }
    }
}

export interface HealthAtkConfig extends HealthConfig{
    atk: number
    canInstantAttack: boolean
    instantAttackTimer: number
    attackInterval: number
}

export class HealthAtkComp<E extends Entity = Entity> extends HealthComp<E> {
    constructor(entity: E, public config: HealthAtkConfig) {
        super(entity, config)
    }

    attack(entity: Entity) {
        if (! this.config.canInstantAttack) return
        this.config.canInstantAttack = false
        console.log(entity)
        entity.getComp(HealthComp)!.takeDamage(this.config.atk)
    }

    update() {
        if (! this.config.canInstantAttack) {
            this.config.instantAttackTimer += this.entity.game.mspf
            if (this.config.instantAttackTimer >= this.config.attackInterval) {
                this.config.canInstantAttack = true
                this.config.instantAttackTimer = 0
            }
        } // TODO: change it into timer?
    }
}

