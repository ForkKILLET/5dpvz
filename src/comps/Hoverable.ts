import { Comp, Emitter, Events } from '@/engine'
import { ShapeComp } from '@/comps/Shape'

export interface HoverableEvents extends Events {
    mouseenter: []
    mouseleave: []
    click: []
    rightclick: []
}

export class HoverableComp extends Comp {
    static dependencies = [ ShapeComp ]

    hovering = false

    emitter = new Emitter<HoverableEvents>()
}

