export type Horarios = HorariosInterface[];

export interface HorariosInterface {
  id_horario: number;
  id_profesional: number;
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
  festivo?: boolean; // Deprecated: mantener por compatibilidad
  dias_festivos?: string[]; // Deprecated: días de semana festivos
  fechas_festivas?: string[]; // Nuevo: fechas específicas festivas (formato YYYY-MM-DD)
}
