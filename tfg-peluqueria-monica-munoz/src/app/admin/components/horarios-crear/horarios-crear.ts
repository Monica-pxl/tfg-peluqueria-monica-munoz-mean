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
  standalone: true
})
export class HorariosCrear implements OnInit {

  id_profesional: string | null = null;
  diasSeleccionados: string[] = [];
  fechasFestivas: string[] = []; // Fechas específicas festivas (YYYY-MM-DD)
  nuevaFechaFestiva = '';
  hora_inicio = '';
  hora_fin = '';

  profesionales: ProfesionalesInterface[] = [];
  profesionalesFiltrados: ProfesionalesInterface[] = [];
  busquedaProfesional: string = '';
  centros: CentrosInterface[] = [];
  usuarios: UsuariosInterface[] = [];
  cargandoProfesionales = false;

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  fechaMinima = new Date().toISOString().split('T')[0];
  formSubmitted = false;
  guardando = false;

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
        this.profesionalesFiltrados = profesionales; // Inicializar filtrados con todos
        // console.log('Profesionales cargados:', profesionales);
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

    const profesional = this.profesionales.find(p => p._id === this.id_profesional);
    if (!profesional) {
      console.warn('Profesional no encontrado con ID:', this.id_profesional);
      // console.log('Profesionales disponibles:', this.profesionales);
      return '';
    }

    // Obtener el _id del centro
    const centroId = typeof profesional.centro === 'object' && profesional.centro !== null
      ? profesional.centro._id
      : profesional.centro;

    const centro = this.centros.find(c => c._id === centroId);
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
        // Filtrar citas del profesional en esa fecha (comparar _id)
        const citasEnFecha = todasCitas.filter(cita => {
          const citaProfesionalId = typeof cita.profesional === 'object' && cita.profesional !== null
            ? cita.profesional._id
            : cita.profesional;
          return citaProfesionalId === this.id_profesional && cita.fecha === this.nuevaFechaFestiva;
        });

        // Contar citas pendientes o confirmadas que serán canceladas (solo para informar al usuario)
        const citasPendientes = citasEnFecha.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada');

        // Agregar la fecha festiva (el backend se encargará de cancelar citas y notificar)
        if (!this.fechasFestivas.includes(this.nuevaFechaFestiva)) {
          this.fechasFestivas.push(this.nuevaFechaFestiva);
          this.fechasFestivas.sort();

          if (citasPendientes.length > 0) {
            this.alertService.warning(
              `Fecha festiva agregada. Se cancelarán automáticamente ${citasPendientes.length} cita(s) pendiente(s) y se notificará a los clientes.`
            );
          } else {
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

  crearHorario(): void {
    this.formSubmitted = true;

    if (!this.id_profesional || this.diasSeleccionados.length === 0 || !this.hora_inicio || !this.hora_fin || this.hora_inicio >= this.hora_fin) {
      return;
    }

    // Buscar el profesional para obtener su _id de MongoDB
    const profesional = this.profesionales.find(p => p._id === this.id_profesional);

    if (!profesional || !profesional._id) {
      this.alertService.error('Profesional no encontrado');
      return;
    }

    const nuevoHorario = {
      profesional: profesional._id,  // Usar _id de MongoDB
      dias: this.diasSeleccionados,
      hora_inicio: this.hora_inicio,
      hora_fin: this.hora_fin,
      fechas_festivas: this.fechasFestivas
    };

    this.guardando = true;
    this.horariosService.createHorario(nuevoHorario).subscribe({
      next: () => {
        this.guardando = false;
        this.alertService.success('Horario creado exitosamente');
        // Las notificaciones se crean automáticamente en el backend
        this.router.navigate(['/admin/horarios'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        this.guardando = false;
        const mensaje = err.error?.error || 'Error al crear el horario';
        this.alertService.error(mensaje);
      }
    });
  }

  filtrarProfesionales(): void {
    if (!this.busquedaProfesional.trim()) {
      this.profesionalesFiltrados = this.profesionales;
      return;
    }

    const busqueda = this.busquedaProfesional.toLowerCase().trim();
    this.profesionalesFiltrados = this.profesionales.filter(prof => {
      const nombreCompleto = `${prof.nombre} ${prof.apellidos}`.toLowerCase();
      return nombreCompleto.includes(busqueda);
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/horarios']);
  }
}

