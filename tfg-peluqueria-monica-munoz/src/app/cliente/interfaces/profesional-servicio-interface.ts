export type ProfesionalesYServicios = ProfesionalServicioInterface[];

export interface ProfesionalServicioInterface {
    _id?: string;  // MongoDB ObjectId
    profesional?: string | { _id: string; nombre: string; apellidos: string; };  // Referencia a Profesional
    servicio?: string | { _id: string; nombre: string; };  // Referencia a Servicio
    // Compatibilidad temporal con código admin
    id_profesional?: number;
    id_servicio?: number;
}
