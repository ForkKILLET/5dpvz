import { Comp, CompCtor, EntityEvents } from '@/engine'

export interface RandomEvents extends EntityEvents {}

export interface RandomConfig {}

export interface RandomState {
    seed: number
}

export class RandomComp extends Comp<RandomConfig, RandomState> {
    // private seedList: number[] = []

    private next(): number {
        this.state.seed = (this.state.seed * 1145147 + 1919810255) % (2 ** 32)
        // this.seedList.push(this.seed)
        return this.state.seed / (2 ** 32)
    }

    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], initSeed: number) {
        return new this(entity, {}, { seed: initSeed })
    }

    public random(min: number, max?: number): number {
        const rand = this.next()
        if (max === undefined) {
            max = min
            min = 0
        }
        return Math.floor(rand * (max - min) + min)
    }
}

