import { HealthComp } from '@/comps/Health'
import { RectShape } from '@/comps/Shape'
import { Entity, EntityEvents, EntityState } from '@/engine'
import { eq, StrictOmit } from '@/utils'

export interface HpBarConfig {}

export interface HpBarState extends EntityState {}

export interface HpBarEvents extends EntityEvents {}

export class HpBarEntity extends Entity<HpBarConfig, HpBarState, HpBarEvents> {
    static readonly size = {
        width: 80,
        height: 5,
    }

    static createHpBarEntity(state: StrictOmit<HpBarState, 'size'>) {
        return new this({}, {
            ...state,
            size: HpBarEntity.size,
        })
    }

    render() {
        this.superEntity?.withComps(
            [ HealthComp, RectShape.withTag(eq('texture')) ],
            (health, rectShape) => {
                const { ctx } = this
                const { rect } = rectShape
                const { width, height } = HpBarEntity.size
                const x = rect.x + rect.width / 2 - width / 2
                const y = rect.y - 10
                ctx.lineWidth = 2
                ctx.strokeStyle = '#000000'
                ctx.strokeRect(x, y, width, height)
                ctx.fillStyle = '#ff0000'
                ctx.fillRect(x, y, width * health.state.hp / health.config.maxHp, height)
            }
        )
    }
}
