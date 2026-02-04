import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorariosService } from '../../../cliente/services/horarios-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { CitasService } from '../../services/citas-service';
import { HorariosInterface } from '../../../cliente/interfaces/horarios-interface';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { CitasInterface } from '../../../cliente/interfaces/citas-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-horarios-editar',
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios-editar.html',
  styleUrl: './horarios-editar.css',
})
export class HorariosEditar implements OnInit {
  
  horario!: HorariosInterface;
  horarioOriginal!: HorariosInterface;
  profesionales: ProfesionalesInterface[] = [];
  centros: CentrosInterface[] = [];
  usuarios: UsuariosInterface[] = [];
  cargando = true;
  error = false;
  nuevaFechaFestiva = '';

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  fechaMinima = new Date().toISOString().split('T')[0];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private horariosService: HorariosService,
    private profesionalesService: ProfesionalesService,
    private centrosService: CentrosService,
    private usuariosService: UsuariosService,
    private notificacionesService: NotificacionesService,
    private citasService: CitasService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar profesionales
    this.profesionalesService.getAllProfesionales().subscribe({ 
      next: p => this.profesionales = p 
    });

    // Cargar centros
    this.centrosService.getAllCentros().subscribe({ 
      next: c => this.centros = c 
    });

    // Cargar usuarios
    this.usuariosService.getAllUsuarios().subscribe({ 
      next: u => this.usuarios = u 
    });

    // Cargar horario
    this.horariosService.getAllHorarios().subscribe({
      next: horarios => {
        const horarioEncontrado = horarios.find(h => h.id_horario === id);
        
        if (!horarioEncontrado) {
          this.error = true;
          this.cargando = false;
          this.alertService.error('Horario no encontrado');
          this.router.navigate(['/admin/horarios']);
          return;
        }
        
        this.horario = horarioEncontrado;
        // Guardar copia profunda del horario original
        this.horarioOriginal = JSON.parse(JSON.stringify(horarioEncontrado));
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.alertService.error('Error al cargar el horario');
        this.router.navigate(['/admin/horarios']);
      }
    });
  }

  toggleDia(dia: string): void {
    const index = this.horario.dias.indexOf(dia);
    if (index > -1) {
      this.horario.dias.splice(index, 1);
      // Limpiar fechas festivas de este día si se deselecciona
      this.limpiarFechasFestivasDia(dia);
    } else {
      this.horario.dias.push(dia);
    }
  }

  isDiaSeleccionado(dia: string): boolean {
    return this.horario.dias.includes(dia);
  }

  agregarFechaFestiva(): void {
    if (!this.nuevaFechaFestiva) {
      this.alertService.warning('Por favor selecciona una fecha');
      return;
    }

    if (!this.horario.fechas_festivas) {
      this.horario.fechas_festivas = [];
    }

    // Validar que la fecha corresponda a un día del horario
    const fecha = new Date(this.nuevaFechaFestiva + 'T00:00:00');
    const diaSemana = this.obtenerNombreDia(fecha.getDay());
    
    if (!this.horario.dias.includes(diaSemana)) {
      this.alertService.warning(`La fecha seleccionada (${diaSemana}) no está en los días del horario`);
      return;
    }

    // VALIDAR CITAS ANTES DE MARCAR COMO FESTIVO
    this.citasService.getAllCitas(this.usuarios).subscribe({
      next: (todasCitas: CitasInterface[]) => {
        // Filtrar citas del profesional en esa fecha
        const citasEnFecha = todasCitas.filter(cita => 
          cita.id_profesional === this.horario.id_profesional &&
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
            const nombreProfesional = this.getNombreProfesional();
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
        if (!this.horario.fechas_festivas!.includes(this.nuevaFechaFestiva)) {
          this.horario.fechas_festivas!.push(this.nuevaFechaFestiva);
          this.horario.fechas_festivas!.sort();
          
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
    if (!this.horario.fechas_festivas) return;
    
    const index = this.horario.fechas_festivas.indexOf(fecha);
    if (index > -1) {
      this.horario.fechas_festivas.splice(index, 1);
    }
  }

  limpiarFechasFestivasDia(dia: string): void {
    if (!this.horario.fechas_festivas) return;
    
    // Eliminar fechas festivas que corresponden a este día de la semana
    this.horario.fechas_festivas = this.horario.fechas_festivas.filter(fecha => {
      const fechaObj = new Date(fecha + 'T00:00:00');
      const diaSemana = this.obtenerNombreDia(fechaObj.getDay());
      return diaSemana !== dia;
    });
  }

  obtenerNombreDia(dia: number): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[dia];
  }

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  getNombreProfesional(): string {
    const profesional = this.profesionales.find(p => p.id_profesional === this.horario.id_profesional);
    return profesional ? `${profesional.nombre} ${profesional.apellidos}` : 'Desconocido';
  }

  getJornadaCentro(): string {
    if (!this.horario?.id_profesional) return '';
    
    const profesional = this.profesionales.find(p => p.id_profesional === this.horario.id_profesional);
    if (!profesional) return '';
    
    const centro = this.centros.find(c => c.id_centro === profesional.id_centro);
    if (!centro) return '';
    
    return `${centro.horario_apertura} - ${centro.horario_cierre}`;
  }

  validarFormulario(): boolean {
    if (!this.horario.id_profesional) {
      this.alertService.warning('Por favor selecciona un profesional');
      return false;
    }

    if (this.horario.dias.length === 0) {
      this.alertService.warning('Por favor selecciona al menos un día');
      return false;
    }

    if (!this.horario.hora_inicio || !this.horario.hora_fin) {
      this.alertService.warning('Por favor completa las horas de inicio y fin');
      return false;
    }

    if (this.horario.hora_inicio >= this.horario.hora_fin) {
      this.alertService.warning('La hora de inicio debe ser menor que la hora de fin');
      return false;
    }

    return true;
  }

  actualizarHorario(): void {
    if (!this.validarFormulario()) {
      return;
    }

    // Comparar con el horario original
    const fechasFestivasAntes = this.horarioOriginal.fechas_festivas?.length || 0;
    const fechasFestivasDespues = this.horario.fechas_festivas?.length || 0;

    this.horariosService.updateHorario(this.horario.id_horario, this.horario).subscribe({
      next: () => {
        this.alertService.success('Horario actualizado exitosamente');
        
        // Crear notificación para el profesional
        const profesional = this.profesionales.find(p => p.id_profesional === this.horario.id_profesional);
        if (profesional) {
          let mensaje = 'El administrador ha actualizado tu horario de trabajo.';
          
          // Si se añadieron fechas festivas
          if (fechasFestivasDespues > fechasFestivasAntes) {
            mensaje = 'El administrador ha marcado un día como <strong class="notif-status">no laborable</strong> en tu agenda.';
          }
          
          this.notificacionesService.crearNotificacion({
            idUsuario: profesional.id_usuario,
            mensaje: mensaje
          });
        }
        
        this.router.navigate(['/admin/horarios'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        const mensaje = err.error?.error || 'Error al actualizar el horario';
        this.alertService.error(mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/horarios']);
  }
}

