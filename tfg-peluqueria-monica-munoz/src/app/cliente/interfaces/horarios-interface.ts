export type Horarios = HorariosInterface[];

export interface ProfesionalPoblado {
  _id: string;
  nombre: string;
  apellidos: string;
}

export interface HorariosInterface {
  _id?: string;  // MongoDB ObjectId
  profesional?: string | ProfesionalPoblado;  // Puede ser ObjectId (string) o profesional poblado
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
  fechas_festivas?: string[]; // Fechas específicas festivas (formato YYYY-MM-DD)
  // Compatibilidad temporal con código admin
  id_horario?: number;
  id_profesional?: number;
}
