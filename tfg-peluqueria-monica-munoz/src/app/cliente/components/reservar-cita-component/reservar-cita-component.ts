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

  profesionalServicios: { id_profesional: number, id_servicio: number }[] = [];

  centroSeleccionado: number | null = null;
  servicioSeleccionado: number | null = null;
  profesionalSeleccionado: number | null = null;
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
    private router: Router,
    private usuariosService: UsuariosService,
    private notificacionesService: NotificacionesService,
    private profesionalServicioAPI: ProfesionalServicioService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
          this.profesionalServicioAPI.getAllProfesionalServicio().subscribe({
          next: (data: ProfesionalServicioInterface[]) => {
            this.profesionalServicios = data.map(ps => ({
              id_profesional: Number(ps.id_profesional),
              id_servicio: Number(ps.id_servicio)
            }));
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
    this.centroSeleccionado = Number(id);
    this.servicioSeleccionado = null;
    this.profesionalSeleccionado = null;
    this.mesDesplazamiento = 0; // Resetear al mes actual
    this.filtrarServicios();
    this.profesionalesFiltrados = [];
  }

  seleccionarServicio(id: string) {
    this.servicioSeleccionado = Number(id);
    this.profesionalSeleccionado = null;
    this.mesDesplazamiento = 0; // Resetear al mes actual
    this.filtrarProfesionales();
  }

  seleccionarProfesional(id: string) {
    this.profesionalSeleccionado = Number(id);
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
      this.serviciosFiltrados = this.servicios.filter(s => Number(s.id_centro) === this.centroSeleccionado);
    } else {
      this.serviciosFiltrados = [];
    }
  }

  filtrarProfesionales() {
    if (this.centroSeleccionado && this.servicioSeleccionado) {
      const profesionalesEnCentro = this.profesionales.filter(p => Number(p.id_centro) === this.centroSeleccionado);
      this.profesionalesFiltrados = profesionalesEnCentro.filter(
        p => this.profesionalTieneServicio(p.id_profesional, this.servicioSeleccionado!)
      );
    } else {
      this.profesionalesFiltrados = [];
    }
  }

  profesionalTieneServicio(profId: number, servicioId: number): boolean {
    return this.profesionalServicios.some(ps => ps.id_profesional === profId && ps.id_servicio === servicioId);
  }

  filtrarHorarios() {
    if (this.profesionalSeleccionado) {
      this.horariosFiltrados = this.horarios.filter(
        h => Number(h.id_profesional) === this.profesionalSeleccionado && !h.festivo
      );
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

    const servicio = this.servicios.find(s => s.id_servicio === this.servicioSeleccionado);
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
    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
    console.log('Filtrando horas ocupadas. Todas las citas:', todasCitas);

    this.horasDisponibles = this.horasDisponibles.filter(slot => {
      const slotInicio = new Date(`${this.fechaSeleccionada}T${slot}`);
      const slotFin = new Date(slotInicio.getTime() + duracionServicio * 60000);

      for (const usuario in todasCitas) {
        for (const cita of todasCitas[usuario]) {
          // Ignorar citas canceladas - esas horas están libres
          if (cita.estado === 'cancelada') {
            console.log('Cita cancelada ignorada:', cita.fecha, cita.hora, 'Estado:', cita.estado);
            continue;
          }
          
          if (cita.profesionalId === this.profesionalSeleccionado && cita.fecha === this.fechaSeleccionada) {
            const citaInicio = new Date(`${cita.fecha}T${cita.hora}`);
            const citaFin = new Date(citaInicio.getTime() + (cita.duracion || 30) * 60000);

            if (slotInicio < citaFin && slotFin > citaInicio) {
              console.log('Hora bloqueada:', slot, 'por cita:', cita.hora, 'Estado:', cita.estado);
              return false;
            }
          }
        }
      }

      return true;
    });
    
    console.log('Horas disponibles después del filtro:', this.horasDisponibles);
  }




  filtrarHorasDisponibles(): void {
    if (!this.profesionalSeleccionado || !this.fechaSeleccionada) return;

    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');

    const servicioSeleccionado = this.servicios.find(s => s.id_servicio === this.servicioSeleccionado);
    const duracionSeleccionada = servicioSeleccionado ? servicioSeleccionado.duracion : 30;

    const posiblesHoras: string[] = [];
    const fechaISO = this.fechaSeleccionada.includes('T') ? this.fechaSeleccionada : this.fechaSeleccionada + 'T00:00:00';
    const diaSemana = new Date(fechaISO).getDay();
    const nombreDia = this.getNombreDia(diaSemana).toLowerCase();

    const horarioDia = this.horariosFiltrados.find(h => h.dias.map(d => d.toLowerCase()).includes(nombreDia));
    if (!horarioDia) return;

    const [hiH, hiM] = (horarioDia.hora_inicio || '00:00').split(':').map(n => Number(n));
    const [hfH, hfM] = (horarioDia.hora_fin || '00:00').split(':').map(n => Number(n));

    const inicio = new Date(fechaISO); inicio.setHours(hiH, hiM, 0, 0);
    const fin = new Date(fechaISO); fin.setHours(hfH, hfM, 0, 0);

    const slotMinutes = 30;
    const cursor = new Date(inicio);

    while (cursor.getTime() + duracionSeleccionada * 60000 <= fin.getTime()) {
      posiblesHoras.push(cursor.getHours().toString().padStart(2, '0') + ':' + cursor.getMinutes().toString().padStart(2, '0'));
      cursor.setMinutes(cursor.getMinutes() + slotMinutes);
    }


    this.horasDisponibles = posiblesHoras.filter(hora => {
      const slotInicio = new Date(`${this.fechaSeleccionada}T${hora}`);
      const slotFin = new Date(slotInicio.getTime() + duracionSeleccionada * 60000);

      const ahora = new Date();
      const hoyStr = ahora.toISOString().slice(0,10); 

      if (this.fechaSeleccionada.slice(0,10) === hoyStr && slotInicio <= ahora) {
        return false;
      }


      for (const usuario in todasCitas) {
        for (const cita of todasCitas[usuario]) {
          // Ignorar citas canceladas - esas horas están libres
          if (cita.estado === 'cancelada') {
            continue;
          }
          
          if (cita.profesionalId === this.profesionalSeleccionado && cita.fecha === this.fechaSeleccionada) {
            const citaInicio = new Date(`${cita.fecha}T${cita.hora}`);
            const citaFin = new Date(citaInicio.getTime() + (cita.duracion || 30) * 60000);
            if (slotInicio < citaFin && slotFin > citaInicio) {
              return false; 
            }
          }
        }
      }

      return true; 
    });
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
    const horarioConFechaFestiva = this.horarios.find(
      h => Number(h.id_profesional) === this.profesionalSeleccionado && 
           h.fechas_festivas && 
           h.fechas_festivas.includes(fechaNormalizada)
    );

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

    const servicio = this.servicios.find(s => s.id_servicio === this.servicioSeleccionado);

    const profesionalEncontrado = this.profesionales.find(p => p.id_profesional === this.profesionalSeleccionado);
    const nombreCompletoProfesional = profesionalEncontrado 
      ? `${profesionalEncontrado.nombre} ${profesionalEncontrado.apellidos}` 
      : 'Desconocido';

    const cita = {
      centro: this.centros.find(c => c.id_centro === this.centroSeleccionado)?.nombre || 'Desconocido',
      servicio: this.servicios.find(s => s.id_servicio === this.servicioSeleccionado)?.nombre || 'Desconocido',
      profesional: nombreCompletoProfesional,
      profesionalId: this.profesionalSeleccionado,
      id_servicio: this.servicioSeleccionado, 
      id_centro: this.centroSeleccionado,
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada,
      duracion: servicio ? servicio.duracion : 30,
      estado: 'pendiente'
    };


    const usuario = this.usuariosService.getUsuarioLogueado();
    if (usuario) {
      const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
      if (!todasCitas[usuario.email]) todasCitas[usuario.email] = [];
      todasCitas[usuario.email].push(cita);
      localStorage.setItem('citas', JSON.stringify(todasCitas));
    }

    const cliente = this.usuariosService.getUsuarioLogueado();
    this.notificacionesService.crearNotificacion({
      idUsuario: Number(cliente?.id_usuario), // Asegurar que sea número
      mensaje: `Has reservado una cita de <strong class="notif-entity">${this.escapeHtml(cita.servicio)}</strong> con <strong class="notif-entity">${this.escapeHtml(cita.profesional)}</strong> el ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}`,
      fecha: new Date().toISOString()
    });
    
    // IMPORTANTE: Guardar el id del profesional en variable local antes de resetear
    const idProfesionalSeleccionado = this.profesionalSeleccionado;
    
    console.log('=== INICIANDO NOTIFICACIONES ===');
    console.log('profesionalSeleccionado antes de notificar:', idProfesionalSeleccionado);
    
    this.usuariosAPI.getAllUsuarios().subscribe({
      next: usuariosList => {
        console.log('getAllUsuarios OK, total usuarios:', usuariosList.length);
        const usuarioLog = this.usuariosService.getUsuarioLogueado();
        
        // Notificar a los administradores
        usuariosList.forEach(u => {
          if (u.rol === 'administrador') {
            this.notificacionesService.crearNotificacion({
              idUsuario: Number(u.id_usuario), // Asegurar que sea número
              mensaje: `Nueva reserva de <strong class="notif-user">${this.escapeHtml(usuarioLog?.nombre || '')}</strong> (${this.escapeHtml(usuarioLog?.email || '')}): <strong class="notif-entity">${this.escapeHtml(cita.servicio)}</strong> con <strong class="notif-entity">${this.escapeHtml(cita.profesional)}</strong> el ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}`,
              fecha: new Date().toISOString()
            });
          }
        });
        
        console.log('Admins notificados, ahora notificando al profesional...');
        console.log('Llamando a getAllProfesionales()...');
        
        // Notificar al profesional
        this.profesionalesAPI.getAllProfesionales().subscribe({
          next: (profesionales: ProfesionalesInterface[]) => {
            console.log('getAllProfesionales OK, total profesionales:', profesionales.length);
            console.log('Todos los profesionales:', profesionales);
            console.log('Buscando profesional con id:', idProfesionalSeleccionado);
            const profesional = profesionales.find(p => p.id_profesional === idProfesionalSeleccionado);
            console.log('Profesional encontrado:', profesional);
            if (profesional && profesional.id_usuario) {
              console.log('Creando notificación para id_usuario:', profesional.id_usuario, '(tipo:', typeof profesional.id_usuario, ')');
              this.notificacionesService.crearNotificacion({
                idUsuario: Number(profesional.id_usuario), // Asegurar que sea número
                mensaje: `Nueva cita reservada: <strong class="notif-user">${this.escapeHtml(usuarioLog?.nombre || '')}</strong> ha reservado <strong class="notif-entity">${this.escapeHtml(cita.servicio)}</strong> contigo el ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}`,
                fecha: new Date().toISOString()
              });
              console.log('Notificación creada para el profesional id_usuario:', profesional.id_usuario);
            } else {
              console.warn('No se pudo crear notificación. Profesional:', profesional);
            }
          },
          error: (err: any) => console.error('ERROR al llamar getAllProfesionales:', err)
        });
      },
      error: (err: any) => console.error('ERROR al llamar getAllUsuarios:', err)
    });
    console.log('Cita reservada:', cita);
    this.mensajeConfirmacion = `¡Cita reservada con éxito para el ${this.fechaSeleccionada} a las ${this.horaSeleccionada}!`;

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
