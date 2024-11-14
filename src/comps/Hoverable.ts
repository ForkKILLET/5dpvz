import { Comp, Emitter, Events, Stopable } from '@/engine'
import { ShapeComp } from '@/comps/Shape'

export interface HoverableEvents extends Events {
    mouseenter: []
    mouseleave: []
    click: [ Stopable ]
    rightclick: [ Stopable ]
}

export class HoverableComp extends Comp {
    static dependencies = [ ShapeComp ]

    hovering = false

    emitter = new Emitter<HoverableEvents>()
}

