import { ClickableEvents, CommonEvents, CommonState, Entity, Game, inRect } from '@/engine'
import { ImageEntity } from '@/entities/image'
import { PLANT_METADATA, PlantMetadata, PlantName } from '@/data/plants'

export interface SlotConfig {
    plantName: PlantName
}

export interface SlotUniqueState {
    cd: number
    isPlantable: boolean
}
export interface SlotState extends SlotUniqueState, CommonState {}

export interface SlotEvents extends ClickableEvents, CommonEvents {}

export class SlotEntity extends Entity<SlotConfig, SlotState, SlotEvents> {
    static initState = <S>(state: S): S & SlotUniqueState => ({
        ...state,
        cd: 0,
        isPlantable: false
    })

    plantMetadata: PlantMetadata
    plantImage: ImageEntity = null as any

    constructor(config: SlotConfig, state: SlotState) {
        super(config, state)

        this.plantMetadata = PLANT_METADATA[this.config.plantName]

        const { position: { x, y }, zIndex } = this.state
        this.state.isPlantable = this.plantMetadata.isPlantableAtStart

        this.delegatedEntities.push(this.plantImage = new ImageEntity(
            {
                src: `./assets/plants/${this.config.plantName}/01.png`
            },
            {
                position: { x: x + 1, y: y + 1 },
                zIndex: zIndex + 1
            }
        ))
    }

    async start(game: Game) {
        await super.start(game)

        // TODO: use mixin
        this.disposers.push(game.mouse.emitter.on('click', () => {
            if (this.isHovering) this.emitter.emit('click', this)
        }))

        this.on('click', () => {
            if (this.state.isPlantable) {
                this.state.isPlantable = false
                this.state.cd = 0
            }
        })
    }

    get isHovering() {
        const { x, y } = this.state.position
        const { mouse } = this.game

        return inRect(mouse.position, { x, y, width: 80 + 2, height: 80 + 20 + 2 })
    }

    render() {
        const { ctx } = this.game
        const { position: { x, y } } = this.state
    
        ctx.strokeStyle = 'brown'
        ctx.strokeRect(x, y, 80 + 2, 80 + 20 + 2)

        this.plantImage.runRender()

        if (! this.state.isPlantable) {
            const cdPercent = this.state.cd / this.plantMetadata.coolDown
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(x + 1, y + 1 + cdPercent * 80, 80, (1 - cdPercent) * 80)
        }

        ctx.fillStyle = 'black'
        ctx.font = '20px Sans'
        const costString = String(this.plantMetadata.cost)
        const { width } = ctx.measureText(costString)
        ctx.fillText(costString, x + 1 + (80 - width) / 2, y + 1 + 80 + 20 - 2)
    }

    update() {
        let { cd, isPlantable } = this.state
        if (isPlantable) return this.state

        const { coolDown: maxCd } = this.plantMetadata
        cd += this.game.mspf
        if (cd > maxCd) {
            cd = maxCd
            isPlantable = true
        }
        return { ...this.state, cd, available: isPlantable }
    }
}