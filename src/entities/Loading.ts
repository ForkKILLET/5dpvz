import { Entity, EntityEvents, EntityState } from '@/engine'
import { pick, placeholder } from '@/utils'

export interface LoadingConfig {}

export interface LoadingState extends EntityState {}

export interface LoadingEvents extends EntityEvents {
    'load': []
}

export class LoadingEntity extends Entity<LoadingConfig, LoadingState, LoadingEvents> {
    taskCount: number = placeholder
    fulfilledTaskCount: number = 0

    constructor(config: LoadingConfig, state: LoadingState) {
        super(config, state)

        this.state.size = pick(this.game.ctx.canvas, [ 'width', 'height' ])

        const tasks = [
            ...Object.values(this.game.imageManager.loadingImgs),
            ...Object.values(this.game.audioManager.loadingAudios),
        ]
        this.taskCount = tasks.length

        tasks.forEach(task => task.then(() => {
            if (++ this.fulfilledTaskCount === this.taskCount) {
                setTimeout(() => {
                    this.emit('load').dispose()
                }, 500)
            }
        }))
    }

    static createLoading() {
        return new this({}, {
            pos: { x: 0, y: 0 },
            zIndex: 0,
            size: placeholder,
        })
    }

    render() {
        const { ctx } = this
        const { width, height } = ctx.canvas

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.font = '36px serif'
        ctx.fillText('5D PvZ Loading...', width / 2, height * 0.4)
        ctx.font = '28px serif'
        ctx.fillText(`${ this.fulfilledTaskCount } / ${ this.taskCount }`, width / 2, height * 0.6)
    }
}
