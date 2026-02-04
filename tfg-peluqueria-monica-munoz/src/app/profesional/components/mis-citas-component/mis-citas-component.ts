import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasInterface } from '../../../cliente/interfaces/citas-interface';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CitasService } from '../../../admin/services/citas-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-mis-citas-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-citas-component.html',
  styleUrl: './mis-citas-component.css',
})
export class MisCitasComponent implements OnInit {

  citas: CitasInterface[] = [];
  citasFiltradas: CitasInterface[] = [];
  usuarios: UsuariosInterface[] = [];
  servicios: ServiciosInterface[] = [];
  centros: CentrosInterface[] = [];
  estados = ['pendiente', 'confirmada', 'cancelada', 'realizada'];
  busquedaTexto: string = '';
  idUsuario: number = 0;
  idProfesional: number = 0;

  constructor(
    private citasService: CitasService,
    private usuariosService: UsuariosService,
    private serviciosService: ServiciosService,
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
    private notificacionesService: NotificacionesService,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    // Obtener el id del usuario del localStorage
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
    this.idUsuario = Number(usuario.id_usuario) || 0;

    // Primero obtener el id_profesional a partir del id_usuario
    this.profesionalesService.getAllProfesionales().subscribe({
      next: profesionales => {
        console.log('Buscando profesional para id_usuario:', this.idUsuario);
        console.log('Profesionales disponibles:', profesionales);
        const profesional = profesionales.find(p => p.id_usuario === this.idUsuario);
        if (profesional) {
          this.idProfesional = profesional.id_profesional;
          console.log('Profesional encontrado:', profesional);
          this.cargarDatos();
        } else {
          this.alertService.error('No se encontró el profesional asociado a tu usuario');
        }
      },
      error: () => this.alertService.error('Error al cargar datos del profesional')
    });
  }

  cargarDatos(): void {
    this.usuariosService.getAllUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.serviciosService.getAllServices().subscribe(servicios => {
          this.servicios = servicios;
          this.centrosService.getAllCentros().subscribe(centros => {
            this.centros = centros;
            this.cargarCitas();
          });
        });
      },
      error: () => this.alertService.error('Error al cargar usuarios')
    });
  }

  cargarCitas(): void {
    this.citasService.getAllCitas(this.usuarios).subscribe({
      next: (citas: CitasInterface[]) => {
        // Filtrar solo las citas del profesional logueado
        this.citas = citas
          .filter(c => c.id_profesional === this.idProfesional)
          .map(c => ({
            ...c,
            estado: c.estado || 'pendiente'
          }));
        this.citasFiltradas = this.citas;
      },
      error: () => this.alertService.error('Error al cargar citas')
    });
  }

  aplicarFiltros(): void {
    this.citasFiltradas = this.citas.filter(cita => {
      const cumpleBusqueda = this.busquedaTexto === '' ||
        this.nombreUsuario(cita.id_usuario).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreServicio(cita.id_servicio).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreCentro(cita.id_centro).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        cita.fecha.includes(this.busquedaTexto) ||
        cita.hora.includes(this.busquedaTexto);
      return cumpleBusqueda;
    });
  }

  cambiarEstado(cita: CitasInterface, nuevoEstado: string): void {
    const estadoAnterior = cita.estado;
    
    // Validar si la cita fue cancelada por el cliente
    if (cita.canceladaPor === 'cliente') {
      this.alertService.warning('No puedes cambiar el estado de una cita cancelada por el cliente');
      // Revertir el cambio en el select
      setTimeout(() => {
        cita.estado = estadoAnterior;
        this.cargarCitas(); // Recargar para forzar la actualización del select
      }, 0);
      return;
    }

    // Validar que no se pueda marcar como realizada una cita ya realizada (usar estadoAnterior)
    if (nuevoEstado === 'realizada' && estadoAnterior === 'realizada') {
      this.alertService.warning('Esta cita ya fue marcada como realizada');
      // Revertir el select
      setTimeout(() => {
        cita.estado = estadoAnterior;
      }, 0);
      return;
    }

    // Validar que no se pueda marcar como realizada una cita que aún no ha pasado
    if (nuevoEstado === 'realizada' && !this.citaYaPaso(cita)) {
      this.alertService.warning('No puedes marcar como realizada una cita que aún no ha pasado');
      // Revertir el cambio en el select
      setTimeout(() => {
        cita.estado = estadoAnterior;
        this.cargarCitas();
      }, 0);
      return;
    }
    
    // Si se marca como realizada, sumar puntos al cliente
    if (nuevoEstado === 'realizada' && estadoAnterior !== 'realizada') {
      // Cambiar el estado temporalmente para actualizar el UI
      cita.estado = 'realizada';
      cita.canceladaPor = null;
      
      this.citasService.marcarCitaRealizada(cita.id_usuario).subscribe({
        next: (response) => {
          // Actualizar el estado en localStorage
          this.citasService.actualizarCitaEstado(cita).subscribe({
            next: () => {
              console.log('Estado actualizado correctamente en localStorage');
            },
            error: () => {
              console.error('Error al actualizar estado en localStorage');
            }
          });
          
          // Obtener el nombre del profesional
          const profesional = this.usuarios.find(u => u.id_usuario === this.idUsuario);
          const nombreProfesional = profesional ? profesional.nombre : 'tu profesional';
          
          // Notificar sobre los puntos y el cambio de estado
          let mensajeCliente = `${nombreProfesional} ha marcado tu cita del ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora} como <strong class="notif-status">realizada</strong>. ¡Has ganado ${response.puntosSumados} puntos!`;
          
          // Si subió de nivel, añadir información del nivel
          if (response.subeNivel) {
            mensajeCliente += ` <br><strong>¡Felicidades! Has alcanzado el nivel ${response.nivelActual}.</strong>`;
          }
          
          this.notificacionesService.crearNotificacion({
            idUsuario: cita.id_usuario,
            mensaje: mensajeCliente,
            fecha: new Date().toISOString()
          });

          // Notificación al admin
          const admins = this.usuarios.filter(u => u.rol === 'administrador');
          admins.forEach(admin => {
            this.notificacionesService.crearNotificacion({
              idUsuario: admin.id_usuario,
              mensaje: `<strong class="notif-user">${nombreProfesional}</strong> ha marcado como <strong class="notif-status">realizada</strong> una cita del ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}.`,
              fecha: new Date().toISOString()
            });
          });

          let mensajeExito = `Cita realizada. ${response.puntosSumados} puntos sumados al cliente.`;
          if (response.subeNivel) {
            mensajeExito += ` ¡El cliente ha alcanzado el nivel ${response.nivelActual}!`;
          }
          this.alertService.success(mensajeExito);
          this.cargarCitas();
        },
        error: () => {
          this.alertService.error('Error al marcar la cita como realizada');
          cita.estado = estadoAnterior;
        }
      });
      return;
    }
    
    // Para otros estados (pendiente, confirmada, cancelada)
    // Cambiar el estado temporalmente en la UI
    cita.estado = nuevoEstado as 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';
    
    // Marcar quién canceló si el nuevo estado es cancelada
    if (nuevoEstado === 'cancelada') {
      cita.canceladaPor = 'profesional';
    } else {
      cita.canceladaPor = null;
    }
    
    this.citasService.actualizarCitaEstado(cita).subscribe({
      next: () => {
        // Obtener el nombre del profesional para la notificación
        const profesional = this.usuarios.find(u => u.id_usuario === this.idUsuario);
        const nombreProfesional = profesional ? profesional.nombre : 'tu profesional';
        
        // Notificación al cliente
        this.notificacionesService.crearNotificacion({
          idUsuario: cita.id_usuario,
          mensaje: `${nombreProfesional} ha <strong class="notif-status">${nuevoEstado === 'confirmada' ? 'confirmado' : nuevoEstado === 'cancelada' ? 'cancelado' : 'actualizado'}</strong> tu cita del ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}.`,
          fecha: new Date().toISOString()
        });

        // Notificación al admin
        const admins = this.usuarios.filter(u => u.rol === 'administrador');
        admins.forEach(admin => {
          this.notificacionesService.crearNotificacion({
            idUsuario: admin.id_usuario,
            mensaje: `<strong class="notif-user">${nombreProfesional}</strong> ha <strong class="notif-status">${nuevoEstado === 'confirmada' ? 'confirmado' : nuevoEstado === 'cancelada' ? 'cancelado' : 'actualizado'}</strong> una cita del ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}.`,
            fecha: new Date().toISOString()
          });
        });

        console.log('Estado actualizado correctamente a:', nuevoEstado);
        this.alertService.success('Estado de cita actualizado correctamente');
      },
      error: () => {
        this.alertService.error('Error al actualizar el estado');
        cita.estado = estadoAnterior;
      }
    });
  }

  nombreUsuario(id_usuario: number): string {
    return this.usuarios.find(u => u.id_usuario === id_usuario)?.nombre || 'Desconocido';
  }

  nombreServicio(id_servicio: number): string {
    const s = this.servicios.find(s => s.id_servicio === id_servicio);
    return s ? s.nombre : 'Desconocido';
  }

  nombreCentro(id_centro: number): string {
    const c = this.centros.find(c => c.id_centro === id_centro);
    return c ? c.nombre : 'Desconocido';
  }

  formatearFechaLocal(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('T')[0].split('-');
    if (parts.length < 3) return fechaIso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Verificar si la cita ya pasó (fecha y hora)
  citaYaPaso(cita: CitasInterface): boolean {
    const fechaHoraCita = new Date(`${cita.fecha}T${cita.hora}`);
    const ahora = new Date();
    return fechaHoraCita < ahora;
  }

  // Obtener estados disponibles según el estado actual y si la cita ya pasó
  getEstadosDisponibles(cita: CitasInterface): string[] {
    // Si la cita ya está realizada, no se puede cambiar
    if (cita.estado === 'realizada') {
      return ['realizada'];
    }
    
    // Si la cita ya está cancelada, solo puede marcar como realizada o mantener cancelada
    if (cita.estado === 'cancelada') {
      if (this.citaYaPaso(cita)) {
        return ['cancelada', 'realizada'];
      } else {
        return ['cancelada'];
      }
    }
    
    // Si la cita está confirmada
    if (cita.estado === 'confirmada') {
      if (this.citaYaPaso(cita)) {
        // Si ya pasó, puede ir a cancelada o realizada (no a pendiente)
        return ['confirmada', 'cancelada', 'realizada'];
      } else {
        // Si no ha pasado, puede ir a cancelada (no a pendiente)
        return ['confirmada', 'cancelada'];
      }
    }
    
    // Si la cita está pendiente
    if (this.citaYaPaso(cita)) {
      return ['pendiente', 'confirmada', 'cancelada', 'realizada'];
    } else {
      return ['pendiente', 'confirmada', 'cancelada'];
    }
  }
}
