import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HorariosService } from '../../../cliente/services/horarios-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { CitasService } from '../../services/citas-service';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { CitasInterface } from '../../../cliente/interfaces/citas-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-horarios-crear',
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios-crear.html',
  styleUrl: './horarios-crear.css',
})
export class HorariosCrear implements OnInit {
  
  id_profesional: string | null = null;
  diasSeleccionados: string[] = [];
  fechasFestivas: string[] = []; // Fechas específicas festivas (YYYY-MM-DD)
  nuevaFechaFestiva = '';
  hora_inicio = '';
  hora_fin = '';

  profesionales: ProfesionalesInterface[] = [];
  centros: CentrosInterface[] = [];
  usuarios: UsuariosInterface[] = [];
  cargandoProfesionales = false;

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  fechaMinima = new Date().toISOString().split('T')[0];

  constructor(
    private horariosService: HorariosService,
    private profesionalesService: ProfesionalesService,
    private centrosService: CentrosService,
    private usuariosService: UsuariosService,
    private notificacionesService: NotificacionesService,
    private citasService: CitasService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarProfesionales();
    this.cargarCentros();
    this.cargarUsuarios();
  }

  cargarProfesionales(): void {
    this.cargandoProfesionales = true;
    this.profesionalesService.getAllProfesionales().subscribe({
      next: (profesionales) => {
        this.profesionales = profesionales;
        console.log('Profesionales cargados:', profesionales);
        this.cargandoProfesionales = false;
      },
      error: (err) => {
        console.error('Error al cargar profesionales:', err);
        this.alertService.error('Error al cargar los profesionales');
        this.cargandoProfesionales = false;
      }
    });
  }

  cargarCentros(): void {
    this.centrosService.getAllCentros().subscribe({
      next: (centros) => {
        this.centros = centros;
      },
      error: () => {
        this.alertService.error('Error al cargar los centros');
      }
    });
  }

  cargarUsuarios(): void {
    this.usuariosService.getAllUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: () => {
        this.alertService.error('Error al cargar los usuarios');
      }
    });
  }

  getJornadaCentro(): string {
    if (!this.id_profesional) return '';
    
    const profesional = this.profesionales.find(p => p.id_profesional === Number(this.id_profesional));
    if (!profesional) {
      console.warn('Profesional no encontrado con ID:', this.id_profesional);
      console.log('Profesionales disponibles:', this.profesionales);
      return '';
    }
    
    const centro = this.centros.find(c => c.id_centro === profesional.id_centro);
    if (!centro) return '';
    
    return `${centro.horario_apertura} - ${centro.horario_cierre}`;
  }

  toggleDia(dia: string): void {
    const index = this.diasSeleccionados.indexOf(dia);
    if (index > -1) {
      this.diasSeleccionados.splice(index, 1);
    } else {
      this.diasSeleccionados.push(dia);
    }
  }

  isDiaSeleccionado(dia: string): boolean {
    return this.diasSeleccionados.includes(dia);
  }

  agregarFechaFestiva(): void {
    if (!this.nuevaFechaFestiva) {
      this.alertService.warning('Por favor selecciona una fecha');
      return;
    }

    // Validar que la fecha corresponda a un día del horario
    const fecha = new Date(this.nuevaFechaFestiva + 'T00:00:00');
    const diaSemana = this.obtenerNombreDia(fecha.getDay());
    
    if (!this.diasSeleccionados.includes(diaSemana)) {
      this.alertService.warning(`La fecha seleccionada (${diaSemana}) no está en los días del horario`);
      return;
    }

    // Validar que se haya seleccionado un profesional
    if (!this.id_profesional) {
      this.alertService.warning('Por favor selecciona un profesional primero');
      return;
    }

    // VALIDAR CITAS ANTES DE MARCAR COMO FESTIVO
    this.citasService.getAllCitas(this.usuarios).subscribe({
      next: (todasCitas: CitasInterface[]) => {
        // Filtrar citas del profesional en esa fecha
        const citasEnFecha = todasCitas.filter(cita => 
          cita.id_profesional === Number(this.id_profesional) &&
          cita.fecha === this.nuevaFechaFestiva
        );

        // Verificar si hay citas confirmadas
        const citasConfirmadas = citasEnFecha.filter(c => c.estado === 'confirmada');
        
        if (citasConfirmadas.length > 0) {
          // BLOQUEAR: No permitir marcar como festivo si hay citas confirmadas
          this.alertService.error(
            `No se puede marcar como festivo. Hay ${citasConfirmadas.length} cita(s) confirmada(s) ese día. ` +
            'Primero cancela o reagenda las citas confirmadas.'
          );
          return;
        }

        // Cancelar citas pendientes y notificar
        const citasPendientes = citasEnFecha.filter(c => c.estado === 'pendiente');
        
        if (citasPendientes.length > 0) {
          // Cancelar cada cita pendiente
          citasPendientes.forEach(cita => {
            cita.estado = 'cancelada';
            cita.canceladaPor = 'admin';
            this.citasService.actualizarCitaEstado(cita).subscribe();

            // Notificar al cliente
            const profesional = this.profesionales.find(p => p.id_profesional === Number(this.id_profesional));
            const nombreProfesional = profesional ? `${profesional.nombre} ${profesional.apellidos}` : 'el profesional';
            
            this.notificacionesService.crearNotificacion({
              idUsuario: cita.id_usuario,
              mensaje: `Tu cita con <strong class="notif-entity">${nombreProfesional}</strong> del ${this.formatearFecha(cita.fecha)} a las ${cita.hora} ha sido <strong class="notif-status">cancelada</strong> porque ese día se marcó como festivo.`,
              fecha: new Date().toISOString()
            });
          });

          this.alertService.warning(
            `Se cancelaron ${citasPendientes.length} cita(s) pendiente(s) de ese día y se notificó a los clientes.`
          );
        }

        // Agregar la fecha festiva
        if (!this.fechasFestivas.includes(this.nuevaFechaFestiva)) {
          this.fechasFestivas.push(this.nuevaFechaFestiva);
          this.fechasFestivas.sort();
          
          if (citasPendientes.length === 0) {
            this.alertService.success('Fecha festiva agregada correctamente');
          }
        }
        
        this.nuevaFechaFestiva = '';
      },
      error: () => {
        this.alertService.error('Error al validar las citas');
      }
    });
  }

  eliminarFechaFestiva(fecha: string): void {
    const index = this.fechasFestivas.indexOf(fecha);
    if (index > -1) {
      this.fechasFestivas.splice(index, 1);
    }
  }

  obtenerNombreDia(dia: number): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[dia];
  }

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  validarFormulario(): boolean {
    if (!this.id_profesional) {
      this.alertService.warning('Por favor selecciona un profesional');
      return false;
    }

    if (this.diasSeleccionados.length === 0) {
      this.alertService.warning('Por favor selecciona al menos un día');
      return false;
    }

    if (!this.hora_inicio || !this.hora_fin) {
      this.alertService.warning('Por favor completa las horas de inicio y fin');
      return false;
    }

    if (this.hora_inicio >= this.hora_fin) {
      this.alertService.warning('La hora de inicio debe ser menor que la hora de fin');
      return false;
    }

    return true;
  }

  crearHorario(): void {
    if (!this.validarFormulario()) {
      return;
    }

    const nuevoHorario = {
      id_profesional: Number(this.id_profesional),
      dias: this.diasSeleccionados,
      hora_inicio: this.hora_inicio,
      hora_fin: this.hora_fin,
      fechas_festivas: this.fechasFestivas
    };

    this.horariosService.createHorario(nuevoHorario).subscribe({
      next: () => {
        this.alertService.success('Horario creado exitosamente');
        
        // Crear notificación para el profesional
        const profesional = this.profesionales.find(p => p.id_profesional === Number(this.id_profesional));
        if (profesional) {
          this.notificacionesService.crearNotificacion({
            idUsuario: profesional.id_usuario,
            titulo: 'Nuevo horario asignado',
            mensaje: 'El administrador ha añadido un nuevo horario a tu agenda.'
          });
        }
        
        this.router.navigate(['/admin/horarios'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        const mensaje = err.error?.error || 'Error al crear el horario';
        this.alertService.error(mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/horarios']);
  }
}

