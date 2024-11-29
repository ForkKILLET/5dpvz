import { fixed } from '@/utils'
import { Game, Vector2D, vSub } from '@/engine'

export type Motion<S extends {}> = (state: S) => Vector2D | null

export interface FrameState {
    frame: number
}

export interface MotionTimeConfig {
    time: number
}
export interface MotionSpeedConfig {
    speed: number
}

export const useMotion = (game: Game) => {
    const withFrame = <T extends {}>(motion: Motion<T>, totalFrame: number): Motion<FrameState & T> => {
        totalFrame = Math.ceil(totalFrame)
        return (state: FrameState & T) => {
            if (state.frame === totalFrame) return null
            const delta = motion(state)
            state.frame ++
            return delta
        }
    }

    const concat = <T extends {}>(motions: Motion<T>[]): Motion<T> => (state: T) => {
        for (const motion of motions) {
            const delta = motion(state)
            if (delta !== null) return delta
        }
        return null
    }

    const linearOnce = (speed: number, angle: number): Motion<{}> => () => ({
        x: speed * fixed(Math.cos(angle)),
        y: speed * fixed(Math.sin(angle)),
    })

    const linear = (speed: number, angle: number, distance: number): Motion<FrameState> =>
        withFrame(linearOnce(speed, angle), distance / speed)

    const linearTo = (
        config: MotionTimeConfig | MotionSpeedConfig,
        from: Vector2D,
        to: Vector2D
    ): Motion<FrameState> => {
        const delta = vSub(to, from)
        const angle = Math.atan2(delta.y, delta.x)
        const distance = Math.hypot(delta.x, delta.y)
        const speed = game.mspf0 * ('speed' in config
            ? config.speed
            : distance / config.time)
        return linear(speed, angle, distance)
    }

    const parabola = (a: number, g: number, x1: number, x2: number): {
        totalFrame: number
        motion: Motion<FrameState>
    } => {
        const y1 = a * x1 ** 2
        const y2 = a * x2 ** 2
        const t1 = Math.sqrt(2 * y1 / g)
        const t2 = Math.sqrt(2 * y2 / g)
        const t = t1 + t2
        const f = Math.ceil(t / game.mspf0)
        const dx = (x2 - x1) / f

        return {
            totalFrame: f,
            motion: (state: FrameState) => {
                if (state.frame === f) return null
                const x = x1 + state.frame * dx
                const y = a * x ** 2
                const yLast = a * (x - dx) ** 2
                state.frame ++
                return {
                    x: dx,
                    y: y - yLast,
                }
            },
        }
    }

    return {
        withFrame,
        concat,

        linearOnce,
        linear,
        linearTo,
        parabola,
    }
}

export const ANGLES = {
    up: - Math.PI / 2,
    down: Math.PI / 2,
    left: Math.PI,
    right: 0,
    upLeft: - Math.PI * 3 / 4,
    upRight: - Math.PI / 4,
    downLeft: Math.PI * 3 / 4,
    downRight: Math.PI / 4,
}
