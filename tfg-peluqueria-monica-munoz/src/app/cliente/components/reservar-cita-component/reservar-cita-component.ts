import { Component, OnInit } from '@angular/core';
import { ServiciosInterface } from '../../interfaces/servicios-interface';
import { ProfesionalesInterface } from '../../interfaces/profesionales-interface';
import { HorariosInterface } from '../../interfaces/horarios-interface';
import { CentrosInterface } from '../../interfaces/centros-interface';
import { UsuariosInterface } from '../../interfaces/usuarios-interface';
import { ServiciosService } from '../../services/servicios-service';
import { ProfesionalesService } from '../../services/profesionales-service';
import { HorariosService } from '../../services/horarios-service';
import { UsuariosService } from '../../services/usuarios-service';
import { CentrosService } from '../../services/centros-service';
import { CitasService } from '../../services/citas-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProfesionalServicioService } from '../../services/profesional-servicio-service';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../services/notificaciones-service';
import { ProfesionalServicioInterface } from '../../interfaces/profesional-servicio-interface';
import { AlertService } from '../../../shared/services/alert-service';


@Component({
  selector: 'app-reservar-cita-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar-cita-component.html',
  styleUrls: ['./reservar-cita-component.css'],
})
export class ReservarCitaComponent implements OnInit {

  servicios: ServiciosInterface[] = [];
  serviciosFiltrados: ServiciosInterface[] = [];

  profesionales: ProfesionalesInterface[] = [];
  profesionalesFiltrados: ProfesionalesInterface[] = [];

  horarios: HorariosInterface[] = [];
  centros: CentrosInterface[] = [];
  usuarios: UsuariosInterface[] = [];

  profesionalServicios: { profesional: string, servicio: string }[] = [];

  centroSeleccionado: string | null = null;
  servicioSeleccionado: string | null = null;
  profesionalSeleccionado: string | null = null;
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';

  horariosFiltrados: HorariosInterface[] = [];
  horasDisponibles: string[] = [];
  diasDisponibles: string[] = [];
  diasMes: (Date | null)[] = [];

  // Variables para navegación de meses
  mesActualOriginal: Date = new Date();
  mesDesplazamiento: number = 0; // 0 = mes actual, 1 = mes siguiente
  nombreMesVisualizado: string = '';

  fechaMinima: string = new Date().toISOString().split('T')[0];
  mensajeConfirmacion: string = '';

  constructor(
    private serviciosAPI: ServiciosService,
    private profesionalesAPI: ProfesionalesService,
    private horariosAPI: HorariosService,
    private usuariosAPI: UsuariosService,
    private centrosAPI: CentrosService,
    private citasAPI: CitasService,
    private router: Router,
    private usuariosService: UsuariosService,
    private notificacionesService: NotificacionesService,
    private profesionalServicioAPI: ProfesionalServicioService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
          this.profesionalServicioAPI.getAllProfesionalServicio().subscribe({
          next: (data: ProfesionalServicioInterface[]) => {
            this.profesionalServicios = data.map(ps => {
              // Extraer los _id de las referencias (pueden estar pobladas o ser strings)
              const profesionalId = typeof ps.profesional === 'object' && ps.profesional !== null
                ? ps.profesional._id
                : ps.profesional;
              const servicioId = typeof ps.servicio === 'object' && ps.servicio !== null
                ? ps.servicio._id
                : ps.servicio;

              return {
                profesional: profesionalId || '',
                servicio: servicioId || ''
              };
            });
            this.loadData();
            this.generarDiasMes();
          },
          error: (err) => console.error('Error al cargar profesional_servicio', err)
      });
  }

  formatearFechaLocal(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('T')[0].split('-');
    if (parts.length < 3) return fechaIso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private escapeHtml(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  loadData(): void {
    this.serviciosAPI.getAllServices().subscribe(data => this.servicios = data);
    this.profesionalesAPI.getAllProfesionales().subscribe(data => this.profesionales = data);
    this.horariosAPI.getAllHorarios().subscribe(data => this.horarios = data);
    this.usuariosAPI.getAllUsuarios().subscribe(data => this.usuarios = data);
    this.centrosAPI.getAllCentros().subscribe(data => this.centros = data);
  }

  seleccionarCentro(id: string) {
    this.centroSeleccionado = id;
    this.servicioSeleccionado = null;
    this.profesionalSeleccionado = null;
    this.mesDesplazamiento = 0; // Resetear al mes actual
    this.filtrarServicios();
    this.profesionalesFiltrados = [];
  }

  seleccionarServicio(id: string) {
    this.servicioSeleccionado = id;
    this.profesionalSeleccionado = null;
    this.mesDesplazamiento = 0; // Resetear al mes actual
    this.filtrarProfesionales();
  }

  seleccionarProfesional(id: string) {
    this.profesionalSeleccionado = id;
    this.mesDesplazamiento = 0; // Resetear al mes actual al cambiar de profesional
    this.filtrarHorarios();
    this.generarDiasDisponibles();
    this.generarDiasMes(); // Regenerar el calendario
    this.horasDisponibles = [];
  }

  seleccionarFecha(fecha: string) {
    this.fechaSeleccionada = fecha;

    if (!fecha) {
      this.horasDisponibles = [];
      return;
    }

    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    if (fechaObj < hoy) {
      this.alertService.warning('No se puede seleccionar un día pasado.');
      this.fechaSeleccionada = '';
      this.horasDisponibles = [];
      return;
    }

    if (!this.esDiaDisponible(fecha)) {
      this.alertService.warning('El profesional NO trabaja ese día. Selecciona otra fecha.');
      this.fechaSeleccionada = '';
      this.horasDisponibles = [];
      return;
    }

    this.filtrarHorasDisponibles();
  }

  filtrarServicios() {
    if (this.centroSeleccionado) {
      // Obtener los profesionales del centro seleccionado
      const profesionalesDelCentro = this.profesionales.filter(p => {
        // Si centro está poblado
        if (typeof p.centro === 'object' && p.centro !== null) {
          return p.centro._id === this.centroSeleccionado;
        }
        // Si centro es string (ObjectId)
        return p.centro === this.centroSeleccionado;
      });

      // Obtener los _id de esos profesionales
      const idsProfesionalesCentro = profesionalesDelCentro.map(p => p._id).filter(Boolean);

      // Obtener los servicios ofrecidos por esos profesionales
      const idsServiciosCentro = this.profesionalServicios
        .filter(ps => idsProfesionalesCentro.includes(ps.profesional))
        .map(ps => ps.servicio);

      // Filtrar servicios únicos
      const idsUnicos = [...new Set(idsServiciosCentro)];
      this.serviciosFiltrados = this.servicios.filter(s => idsUnicos.includes(s._id || ''));
    } else {
      this.serviciosFiltrados = [];
    }
  }

  filtrarProfesionales() {
    if (this.centroSeleccionado && this.servicioSeleccionado) {
      // Filtrar profesionales del centro
      const profesionalesEnCentro = this.profesionales.filter(p => {
        // Si centro está poblado
        if (typeof p.centro === 'object' && p.centro !== null) {
          return p.centro._id === this.centroSeleccionado;
        }
        // Si centro es string (ObjectId)
        return p.centro === this.centroSeleccionado;
      });

      // Filtrar los que tienen el servicio seleccionado
      this.profesionalesFiltrados = profesionalesEnCentro.filter(
        p => this.profesionalTieneServicio(p._id || '', this.servicioSeleccionado!)
      );
    } else {
      this.profesionalesFiltrados = [];
    }
  }

  profesionalTieneServicio(profId: string, servicioId: string): boolean {
    return this.profesionalServicios.some(ps => ps.profesional === profId && ps.servicio === servicioId);
  }

  filtrarHorarios() {
    if (this.profesionalSeleccionado) {
      this.horariosFiltrados = this.horarios.filter(h => {
        // Si profesional está poblado
        if (typeof h.profesional === 'object' && h.profesional !== null) {
          return h.profesional._id === this.profesionalSeleccionado;
        }
        // Si profesional es string (ObjectId)
        return h.profesional === this.profesionalSeleccionado;
      });
    } else {
      this.horariosFiltrados = [];
    }
    this.generarDiasDisponibles();
  }

  generarDiasDisponibles() {
    this.diasDisponibles = this.horariosFiltrados
      .flatMap(h => h.dias.map(d => d.toLowerCase().trim()))
      .filter(Boolean);
  }


  generarHorasDisponibles() {
    this.horasDisponibles = [];
    if (!this.profesionalSeleccionado || !this.fechaSeleccionada || !this.servicioSeleccionado) return;

    // BLOQUEAR DÍAS FESTIVOS - no generar horas disponibles
    if (this.esDiaFestivo(this.fechaSeleccionada)) {
      this.horasDisponibles = [];
      return;
    }

    const servicio = this.servicios.find(s => s._id === this.servicioSeleccionado);
    const duracionServicio = servicio ? servicio.duracion : 30;

    const fechaISO = this.fechaSeleccionada.includes('T') ? this.fechaSeleccionada : this.fechaSeleccionada + 'T00:00:00';
    const diaSemana = new Date(fechaISO).getDay();
    const nombreDia = this.getNombreDia(diaSemana).toLowerCase();

    const horarioDia = this.horariosFiltrados.find(h => h.dias.map(d => d.toLowerCase()).includes(nombreDia));
    if (!horarioDia) return;

    const [hiH, hiM] = (horarioDia.hora_inicio || '00:00').split(':').map(n => Number(n));
    const [hfH, hfM] = (horarioDia.hora_fin || '00:00').split(':').map(n => Number(n));

    const inicio = new Date(fechaISO); inicio.setHours(hiH, hiM, 0, 0);
    const fin = new Date(fechaISO); fin.setHours(hfH, hfM, 0, 0);

    const intervalo = 10;
    const cursor = new Date(inicio);

    while (cursor.getTime() + duracionServicio * 60000 <= fin.getTime()) {
      const hh = cursor.getHours().toString().padStart(2, '0');
      const mm = cursor.getMinutes().toString().padStart(2, '0');
      this.horasDisponibles.push(`${hh}:${mm}`);
      cursor.setMinutes(cursor.getMinutes() + intervalo);
    }

    const ahora = new Date();
    this.horasDisponibles = this.horasDisponibles.filter(slot => {
      const slotInicio = new Date(`${this.fechaSeleccionada}T${slot}`);
      return !(this.fechaSeleccionada === this.formatDate(ahora) && slotInicio <= ahora);
    });

    this.filtrarHorasOcupadas(duracionServicio);
  }



  filtrarHorasOcupadas(duracionServicio: number) {
    if (!this.profesionalSeleccionado || !this.fechaSeleccionada) return;

    // Obtener citas del profesional desde la API
    this.citasAPI.getCitasPorProfesional(this.profesionalSeleccionado).subscribe({
      next: (citas) => {
        // Filtrar solo citas de la fecha seleccionada y no canceladas
        const citasDelDia = citas.filter(cita =>
          cita.fecha === this.fechaSeleccionada &&
          cita.estado !== 'cancelada'
        );

        // Filtrar las horas disponibles
        this.horasDisponibles = this.horasDisponibles.filter(slot => {
          const slotInicio = new Date(`${this.fechaSeleccionada}T${slot}`);
          const slotFin = new Date(slotInicio.getTime() + duracionServicio * 60000);

          // Verificar si esta hora se solapa con alguna cita existente
          for (const cita of citasDelDia) {
            const citaInicio = new Date(`${cita.fecha}T${cita.hora}`);
            // Obtener la duración del servicio de la cita
            const duracionCita = typeof cita.servicio === 'object' && cita.servicio !== null
              ? cita.servicio.duracion
              : 30;
            const citaFin = new Date(citaInicio.getTime() + duracionCita * 60000);

            // Si hay solapamiento, esta hora no está disponible
            if (slotInicio < citaFin && slotFin > citaInicio) {
              return false;
            }
          }

          return true;
        });
      },
      error: (err) => {
        console.error('Error al obtener citas del profesional:', err);
        // En caso de error, mantener las horas disponibles sin filtrar
      }
    });
  }




  filtrarHorasDisponibles(): void {
    // Este método ahora simplemente llama a generarHorasDisponibles
    this.generarHorasDisponibles();
  }

  generarDiasMes() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + this.mesDesplazamiento; // Añadir desplazamiento

    // Calcular el mes y año correctos si pasamos de año
    const fechaMes = new Date(year, month, 1);
    const yearFinal = fechaMes.getFullYear();
    const monthFinal = fechaMes.getMonth();

    // Actualizar el nombre del mes visualizado
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.nombreMesVisualizado = `${meses[monthFinal]} ${yearFinal}`;

    const numDias = new Date(yearFinal, monthFinal + 1, 0).getDate();

    const primerDiaSemana = new Date(yearFinal, monthFinal, 1).getDay();

    this.diasMes = [];

    const huecos = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    for (let i = 0; i < huecos; i++) {
      this.diasMes.push(null);
    }

    for (let i = 1; i <= numDias; i++) {
      this.diasMes.push(new Date(yearFinal, monthFinal, i));
    }
  }


  formatDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getNombreDia(dia: number): string {
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return dias[dia];
  }

  esDiaDisponible(fecha: string): boolean {
    const fechaISO = fecha.includes('T') ? fecha : fecha + 'T00:00:00';
    const dia = new Date(fechaISO);

    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    if (dia < hoy) return false;

    // BLOQUEAR DÍAS FESTIVOS - no se pueden reservar citas
    if (this.esDiaFestivo(fecha)) return false;

    const nombreDia = this.getNombreDia(dia.getDay()).toLowerCase();

    if (!this.diasDisponibles.includes(nombreDia)) return false;

    const horarioDia = this.horariosFiltrados.find(h => h.dias.map(d => d.toLowerCase()).includes(nombreDia));
    if (!horarioDia) return false;

    const [hiH, hiM] = (horarioDia.hora_inicio || '00:00').split(':').map(n => Number(n));
    const [hfH, hfM] = (horarioDia.hora_fin || '00:00').split(':').map(n => Number(n));

    const inicio = new Date(fechaISO); inicio.setHours(hiH, hiM, 0, 0);
    const fin = new Date(fechaISO); fin.setHours(hfH, hfM, 0, 0);

    const duracionServicio = 30;
    const intervalo = 10;
    const cursor = new Date(inicio);

    const ahora = new Date();

    while (cursor.getTime() + duracionServicio * 60000 <= fin.getTime()) {
      if (fecha.slice(0,10) === ahora.toISOString().slice(0,10) && cursor <= ahora) {
        cursor.setMinutes(cursor.getMinutes() + intervalo);
        continue;
      }
      return true;
    }

    return false;
  }

  esDiaFestivo(fecha: string): boolean {
    if (!this.profesionalSeleccionado) return false;

    // Normalizar fecha a formato YYYY-MM-DD
    const fechaNormalizada = fecha.includes('T') ? fecha.split('T')[0] : fecha;

    // Buscar horarios de este profesional que contengan esta fecha como festiva
    const horarioConFechaFestiva = this.horarios.find(h => {
      // Verificar si el profesional coincide
      const profesionalMatch = typeof h.profesional === 'object' && h.profesional !== null
        ? h.profesional._id === this.profesionalSeleccionado
        : h.profesional === this.profesionalSeleccionado;

      // Verificar si tiene fechas festivas que incluyan esta fecha
      return profesionalMatch && h.fechas_festivas && h.fechas_festivas.includes(fechaNormalizada);
    });

    return !!horarioConFechaFestiva;
  }


  reservarCita(selectCentro: HTMLSelectElement, selectServicio: HTMLSelectElement, selectProf: HTMLSelectElement) {
    if (!this.usuariosService.comprobarLogueado()) {
      this.alertService.warning('Debes iniciar sesión para reservar una cita.');
      this.router.navigate(['/iniciar-sesion']);
      return;
    }

    if (!this.centroSeleccionado || !this.servicioSeleccionado || !this.profesionalSeleccionado || !this.fechaSeleccionada || !this.horaSeleccionada) {
      this.alertService.warning('Completa todos los campos antes de reservar.');
      return;
    }

    const usuarioLogueado = this.usuariosService.getUsuarioLogueado();
    if (!usuarioLogueado || !usuarioLogueado._id) {
      this.alertService.error('Error: No se pudo obtener el usuario logueado.');
      return;
    }

    // Crear la cita en la base de datos
    const nuevaCita = {
      usuario: usuarioLogueado._id,
      profesional: this.profesionalSeleccionado,
      servicio: this.servicioSeleccionado,
      centro: this.centroSeleccionado,
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada
    };

    this.citasAPI.crearCita(nuevaCita).subscribe({
      next: (response) => {
        console.log('Cita creada exitosamente:', response);
        this.mensajeConfirmacion = `¡Cita reservada con éxito para el ${this.fechaSeleccionada} a las ${this.horaSeleccionada}!`;
        this.alertService.success(this.mensajeConfirmacion);

        // Resetear formulario
        this.centroSeleccionado = null;
        this.servicioSeleccionado = null;
        this.profesionalSeleccionado = null;
        this.fechaSeleccionada = '';
        this.horaSeleccionada = '';
        this.horasDisponibles = [];
        this.diasDisponibles = [];
        selectCentro.value = '';
        selectServicio.value = '';
        selectProf.value = '';
      },
      error: (err) => {
        console.error('Error al crear cita:', err);
        this.alertService.error(err.error?.error || 'Error al reservar la cita. Inténtalo de nuevo.');
      }
    });
  }

  // Navegación entre meses
  mesAnterior() {
    if (this.mesDesplazamiento > 0) {
      this.mesDesplazamiento--;
      this.generarDiasMes();
      this.limpiarSeleccionFecha();
    }
  }

  mesSiguiente() {
    if (this.mesDesplazamiento < 1) { // Solo permitir hasta el mes siguiente
      this.mesDesplazamiento++;
      this.generarDiasMes();
      this.limpiarSeleccionFecha();
    }
  }

  puedeIrMesAnterior(): boolean {
    return this.mesDesplazamiento > 0;
  }

  puedeIrMesSiguiente(): boolean {
    return this.mesDesplazamiento < 1;
  }

  private limpiarSeleccionFecha() {
    this.fechaSeleccionada = '';
    this.horasDisponibles = [];
  }
}
