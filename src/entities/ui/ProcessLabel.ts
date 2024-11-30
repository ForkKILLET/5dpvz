import { RectShape } from '@/comps/Shape'
import { Entity, EntityEvents, EntityState } from '@/engine'
import { StrictOmit } from '@/utils'
import { kProcess } from '@/entities/Process'
import { ButtonComp, ButtonLikeEvents } from '@/comps/Button'
import { HoverableComp } from '@/comps/Hoverable'
import { CursorComp } from '@/comps/Cursor'

export interface ProcessLabelConfig {}

export interface ProcessLabelState extends EntityState {}

export interface ProcessLabelEvents extends ButtonLikeEvents, EntityEvents {}

export class ProcessLabelEntity extends Entity<ProcessLabelConfig, ProcessLabelState, ProcessLabelEvents> {
    static readonly size = {
        width: 64 + 5,
        height: 20,
    }

    constructor(config: ProcessLabelConfig, state: ProcessLabelState) {
        super(config, state)

        this
            .addComp(RectShape, ProcessLabelEntity.size)
            .addComp(HoverableComp)
            .addComp(CursorComp, 'pointer')
            .addComp(ButtonComp)
    }

    static createProcessLabel(state: StrictOmit<ProcessLabelState, 'size'>) {
        return new this({}, { ...state, size: ProcessLabelEntity.size })
    }

    get processId() {
        return this.inject(kProcess)!.config.processId
    }

    get color() {
        const { processId } = this
        if (processId > 0) return '#008000'
        else if (processId < 0) return '#000000'
        else return '#696a6a'
    }

    render() {
        const { width, height } = ProcessLabelEntity.size
        const { x, y } = this.state.pos
        const { ctx, color, processId } = this
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + width, y)
        ctx.lineTo(x + width - height / 2, y + height / 2)
        ctx.lineTo(x + width, y + height)
        ctx.lineTo(x, y + height)
        ctx.lineTo(x + height / 2, y + height / 2)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.font = '20px Sans'
        ctx.fillText(processId.toString(), x + width / 2, y + 20 - 3)
    }
}
