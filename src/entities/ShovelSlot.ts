import {Entity, EntityEvents, EntityState, inRect} from "@/engine";
import {HoverableComp, HoverableEvents} from "@/comps/Hoverable.ts";
import {getShovelImageSrc, SHOVEL_METADATA, ShovelId, ShovelMetadata} from "@/data/shovel.ts";
import {ShapeComp} from "@/comps/Shape.ts";
import {ImageEntity} from "@/entities/Image.ts";

export interface ShovelSlotConfig {
    shovelId: ShovelId;
}

export interface ShovelSlotState extends EntityState {}

export interface ShovelSlotEvents extends HoverableEvents, EntityEvents {}

export class ShovelSlotEntity extends Entity<ShovelSlotConfig, ShovelSlotState, ShovelSlotEvents> {
    shovelMetadata: ShovelMetadata

    readonly width = 80 + 2
    readonly height = 80 + 20 + 2

    constructor(config: ShovelSlotConfig, state: ShovelSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this
            .addComp(new ShapeComp(point =>
                inRect(point, { x, y, width: 80 + 2, height: 80 + 20 + 2})
            ))
            .addComp(new HoverableComp())

        this.shovelMetadata = SHOVEL_METADATA[this.config.shovelId]

        this.afterStart(() => {
            this.attach(new ImageEntity(
                {
                    src: getShovelImageSrc(this.config.shovelId),
                },
                {
                    position: {x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2
                }
            ))
        })
    }

    preRender() {
        super.preRender()


    }
}
