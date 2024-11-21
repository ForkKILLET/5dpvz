import { Comp, Emitter, Events, Stopable } from '@/engine'
import { ShapeComp } from '@/comps/Shape'
import { eq, mapk } from '@/utils'

export interface HoverableEvents extends Events {
    mouseenter: []
    mouseleave: []
    click: [ Stopable ]
    rightclick: [ Stopable ]
}

export class HoverableComp extends Comp {
    static readonly dependencies = [ Comp.selector(ShapeComp, mapk('tag', eq('boundary'))) ]

    hovering = false

    emitter = new Emitter<HoverableEvents>()
}
