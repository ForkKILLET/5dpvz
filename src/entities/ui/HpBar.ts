import { HealthComp } from '@/comps/Health'
import { RectShape } from '@/comps/Shape'
import { Entity, EntityEvents, EntityState } from '@/engine'
import { eq } from '@/utils'

export interface HpBarConfig {}

export interface HpBarState extends EntityState {}

export interface HpBarEvents extends EntityEvents {}

export class HpBarEntity extends Entity<HpBarConfig, HpBarState, HpBarEvents> {
    render() {
        this.superEntity?.withComps(
            [ HealthComp, RectShape.withTag(eq('texture')) ],
            (health, rectShape) => {
                const { ctx } = this.game
                const { rect } = rectShape
                const w = 80
                const h = 5
                const x = rect.x + rect.width / 2 - w / 2
                const y = rect.y - 10
                ctx.lineWidth = 2
                ctx.strokeStyle = '#000000'
                ctx.strokeRect(x, y, w, h)
                ctx.fillStyle = '#ff0000'
                ctx.fillRect(x, y, w * health.state.hp / health.config.maxHp, h)
            }
        )
    }
}
