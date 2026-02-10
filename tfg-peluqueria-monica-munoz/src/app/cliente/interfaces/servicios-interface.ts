export type Sercicios = ServiciosInterface[]

export interface ServiciosInterface {
    _id?: string;  // MongoDB ObjectId
    nombre: string;
    descripcion: string;
    duracion: number;
    precio: number;
    imagen: string;
    centro?: string | { _id: string; nombre: string };  // Referencia al centro (puede estar populado)
    // Compatibilidad temporal con código admin
    id_servicio?: number;
    id_centro?: number;
}
