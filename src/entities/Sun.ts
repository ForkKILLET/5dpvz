import { Entity, EntityEvents, EntityState } from '@/engine'

interface SunConfig {
    life: number
}

interface SunUniqueState {}
interface SunState extends SunUniqueState, EntityState {}

interface SunEvents extends EntityEvents {}

export class SunEntity extends Entity<SunConfig, SunState, SunEvents> {

}