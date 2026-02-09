export type Horarios = HorariosInterface[];

export interface ProfesionalPoblado {
  _id: string;
  nombre: string;
  apellidos: string;
}

export interface HorariosInterface {
  _id?: string;  // MongoDB ObjectId
  id_horario?: number;  // Deprecated: mantener por compatibilidad
  profesional?: string | ProfesionalPoblado;  // Puede ser ObjectId (string) o profesional poblado
  id_profesional?: number;  // Deprecated: mantener por compatibilidad
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
  festivo?: boolean; // Deprecated: mantener por compatibilidad
  dias_festivos?: string[]; // Deprecated: días de semana festivos
  fechas_festivas?: string[]; // Nuevo: fechas específicas festivas (formato YYYY-MM-DD)
}
