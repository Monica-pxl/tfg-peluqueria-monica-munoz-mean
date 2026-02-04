export type Sercicios = ServiciosInterface[]

export interface ServiciosInterface {
    id_servicio: number
    nombre: string
    descripcion: string
    duracion: number
    precio: number
    id_centro: number
    imagen: string;
}
