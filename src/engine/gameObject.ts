import { Emitter, Events, ListenerOptions, RenderJob, State, vAdd, Vector2D, vSub } from '@/engine'
import { by, Disposer, RemoveIndex } from '@/utils'

export interface GameObjectEvents extends Events {
    'dispose': []
    'before-render': []
    'after-render': []
}

export abstract class GameObject<S = any, V extends GameObjectEvents = GameObjectEvents> extends State<S> {
    abstract ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
    pipeline: any

    abstract get zIndex(): number
    abstract get pos(): Vector2D
    abstract superObject: GameObject

    renderJobs: RenderJob[] = []
    addRenderJob(renderer: () => void, zIndexDelta = 0) {
        this.renderJobs.push({
            zIndex: this.zIndex + zIndexDelta,
            renderer,
        })
    }
    abstract preRender(): void
    abstract render(): void
    runRender() {
        this.preRender()

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        this.renderJobs
            .sort(by(job => job.zIndex))
            .forEach(job => {
                this.ctx.save()
                job.renderer()
                this.ctx.restore()
            })
        this.renderJobs = []

        if (this.superObject !== this) this.superObject.addRenderJob(() => {
            this.ctx.save()
            this.bubble('before-render')
            this.render()
            this.bubble('after-render')
            this.ctx.restore()

            const { canvas, offset } = this.pipeline.getOutput()
            const pos = vAdd(vSub(this.pos, this.superObject.pos), offset)

            this.superObject.ctx.drawImage(canvas, pos.x, pos.y)
        }, this.zIndex - this.superObject.zIndex)
    }

    protected disposers: Disposer[] = []
    disposed = false
    dispose() {
        if (this.disposed) return false
        this.disposed = true

        this.emit('dispose')

        this.disposers.forEach(dispose => dispose())

        return true
    }

    emitter = new Emitter<V>()
    emit<K extends keyof RemoveIndex<V>>(event: K, ...args: V[K]) {
        this.emitter.emit(event, ...args)
        return this
    }
    on<K extends keyof RemoveIndex<V>>(event: K, listener: (...args: V[K]) => void, options: ListenerOptions = {}) {
        const off = this.emitter.on(event, listener, options)
        this.disposers.push(off)
        return this
    }
    onSome<const Ks extends (keyof RemoveIndex<V>)[]>(
        events: Ks, listener: (...args: [ Ks[number], ...V[Ks[number]] ]) => void,
    ) {
        const off = this.emitter.onSome(events, listener)
        this.disposers.push(off)
        return this
    }
    bubble<K extends keyof RemoveIndex<V>>(event: K, ...args: V[K]) {
        this.emit(event, ...args)
        if (this.superObject !== this) this.superObject.bubble(event, ...args)
        return this
    }
    forwardEvents<F extends Events, Ks extends (keyof RemoveIndex<V> & keyof RemoveIndex<F>)[]>(
        source: Emitter<F>, events: Ks,
    ) {
        this.emitter.forward(source, events)
        return this
    }
}
