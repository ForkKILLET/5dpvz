import { RectShape } from '@/comps/Shape'
import { Entity, EntityState } from '@/engine'
import { pick } from '@/utils'
import { kProcess } from '../Process'

export interface ProcessLabelConfig {}

export interface ProcessLabelState extends EntityState {}

export class ProcessLabelEntity extends Entity<ProcessLabelConfig> {
    width = 64 + 5
    height = 20

    constructor(config: ProcessLabelConfig, state: ProcessLabelState) {
        super(config, state)

        this
            .addComp(RectShape, pick(this, [ 'width', 'height' ]))
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
        const { ctx } = this.game
        const { x, y } = this.state.position
        const { color, processId } = this
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + this.width, y)
        ctx.lineTo(x + this.width - this.height / 2, y + this.height / 2)
        ctx.lineTo(x + this.width, y + this.height)
        ctx.lineTo(x, y + this.height)
        ctx.lineTo(x + this.height / 2, y + this.height / 2)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.font = '20px Sans'
        ctx.fillText(processId.toString(), x + this.width / 2, y + 20 - 3)
    }
}
