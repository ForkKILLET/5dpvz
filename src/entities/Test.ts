import { EntityEvents, EntityState, Entity } from '@/engine'

export interface TestConfig {}

export interface TestState extends EntityState {
    moveDirection: 'left' | 'right' | 'up' | 'down'
}

export interface TestEvents extends EntityEvents {}

export class TestEntity extends Entity<TestConfig, TestState, TestEvents> {
    render() {
        const { ctx } = this.game
        const { x, y } = this.state.position
        ctx.fillStyle = 'red'
        ctx.fillRect(x, y, 10, 10)
    }

    update() {
        let { position: { x, y }, moveDirection: dir } = this.state

        x += dir === 'left' ? - 1 : dir === 'right' ? + 1 : 0
        y += dir === 'up' ? - 1 : dir === 'down' ? + 1 : 0

        if (dir === 'right' && x === 100) dir = 'down'
        else if (dir === 'down' && y === 100) dir = 'left'
        else if (dir === 'left' && x === 0) dir = 'up'
        else if (dir === 'up' && y === 0) dir = 'right'
        return {
            ...this.state,
            position: { x, y },
            moveDirection: dir,
        }
    }
}
