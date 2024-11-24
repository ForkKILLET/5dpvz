import { Comp, CompCtor, Emitter, Events, Stopable } from '@/engine'
import { ShapeComp } from '@/comps/Shape'
import { eq } from '@/utils'

export interface HoverableEvents extends Events {
    mouseenter: []
    mouseleave: []
    click: [ Stopable ]
    rightclick: [ Stopable ]
}

export interface HoverableConfig {}

export interface HoverableState {
    hovering: boolean
}

export class HoverableComp extends Comp<HoverableConfig, HoverableState> {
    static readonly dependencies = [ ShapeComp.withTag(eq('boundary')) ]

    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity']) {
        return new this(entity, {}, { hovering: false })
    }

    emitter = new Emitter<HoverableEvents>()
}
