import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { ProfesionalServicioService } from '../../../cliente/services/profesional-servicio-service';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-profesionales-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesionales-crear.html',
  styleUrls: ['./profesionales-crear.css'],
})
export class ProfesionalesCrear implements OnInit {

  id_usuario: string = '';  // Cambio a string para usar _id de MongoDB
  id_centro: string = '';   // Cambio a string para usar _id de MongoDB
  id_servicios: string[] = [];  // Cambio a string[] para usar _id de MongoDB

  usuariosProfesionales: UsuariosInterface[] = [];
  centros: CentrosInterface[] = [];
  servicios: ServiciosInterface[] = [];
  serviciosFiltrados: ServiciosInterface[] = [];
  cargando = true;

  constructor(
    private profesionalesService: ProfesionalesService,
    private usuariosService: UsuariosService,
    private centrosService: CentrosService,
    private serviciosService: ServiciosService,
    private profesionalServicioService: ProfesionalServicioService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cargar usuarios con rol "profesional" que no estén asignados a ningún profesional
    this.usuariosService.getAllUsuarios().subscribe({
      next: (usuarios) => {
        this.profesionalesService.getAllProfesionales().subscribe({
          next: (profesionales) => {
            console.log('Profesionales existentes:', profesionales);
            console.log('Todos los usuarios:', usuarios);

            // Filtrar usuarios con rol profesional que no tengan un profesional asociado
            // Crear array de IDs de usuarios que ya tienen profesional
            const idsUsuariosConProfesional: string[] = profesionales
              .map(p => {
                // Si 'usuario' es un objeto poblado
                if (typeof p.usuario === 'object' && p.usuario !== null) {
                  return p.usuario._id;
                }
                // Si 'usuario' es un string (ObjectId)
                return p.usuario;
              })
              .filter((id): id is string => id !== undefined && id !== null);

            console.log('IDs de usuarios con profesional:', idsUsuariosConProfesional);

            this.usuariosProfesionales = usuarios.filter(u => {
              if (u.rol !== 'profesional') return false;

              // Excluir si el _id del usuario ya está en profesionales
              if (u._id && idsUsuariosConProfesional.includes(u._id)) {
                console.log(`Excluyendo usuario ${u.nombre} (_id: ${u._id}) - ya tiene profesional`);
                return false;
              }

              return true;
            });

            console.log('Usuarios profesionales disponibles:', this.usuariosProfesionales);

            forkJoin({
              centros: this.centrosService.getAllCentros(),
              servicios: this.serviciosService.getAllServices()
            }).subscribe({
              next: ({ centros, servicios }) => {
                this.centros = centros;
                this.servicios = servicios;
                this.cargando = false;
              },
              error: () => {
                this.alertService.error('Error al cargar los datos');
                this.cargando = false;
              }
            });
          },
          error: () => {
            this.alertService.error('Error al cargar los profesionales');
            this.cargando = false;
          }
        });
      },
      error: () => {
        this.alertService.error('Error al cargar los usuarios');
        this.cargando = false;
      }
    });
  }

  onCentroChange(): void {
    // Resetear servicios seleccionados al cambiar de centro
    this.id_servicios = [];

    // Filtrar servicios por el centro seleccionado
    if (this.id_centro) {
      this.serviciosFiltrados = this.servicios.filter(s => {
        // Si 'centro' es un objeto poblado
        if (typeof s.centro === 'object' && s.centro !== null) {
          return s.centro._id === this.id_centro;
        }
        // Si 'centro' es un string (ObjectId)
        return s.centro === this.id_centro;
      });
      console.log('Servicios filtrados para centro', this.id_centro, ':', this.serviciosFiltrados);
    } else {
      this.serviciosFiltrados = [];
    }
  }

  crearProfesional(): void {
    if (!this.id_usuario || !this.id_centro) {
      this.alertService.warning('Por favor selecciona un usuario y un centro');
      return;
    }

    // Obtener el usuario seleccionado para extraer nombre y apellidos
    const usuario = this.usuariosProfesionales.find(u => u._id === this.id_usuario);
    if (!usuario) {
      this.alertService.error('Usuario no encontrado');
      console.error('No se encontró usuario con _id:', this.id_usuario);
      console.log('Usuarios disponibles:', this.usuariosProfesionales);
      return;
    }

    // Separar el nombre completo en nombre y apellidos
    const nombreCompleto = usuario.nombre.trim().split(' ');
    const nombre = nombreCompleto[0] || 'Sin nombre';
    const apellidos = nombreCompleto.slice(1).join(' ') || 'Sin apellidos';

    const nuevoProfesional = {
      usuario: this.id_usuario,  // Backend espera 'usuario' con el _id del usuario
      nombre: nombre,
      apellidos: apellidos,
      centro: this.id_centro
    };

    console.log('Datos del profesional a crear:');
    console.log('- usuario:', nuevoProfesional.usuario);
    console.log('- nombre:', nuevoProfesional.nombre);
    console.log('- apellidos:', nuevoProfesional.apellidos);
    console.log('- centro:', nuevoProfesional.centro);
    console.log('Objeto completo:', nuevoProfesional);

    this.profesionalesService.crearProfesional(nuevoProfesional).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        const idProfesional = response.profesional._id; // Usar _id en lugar de id_profesional

        // Si hay servicios seleccionados, crear las relaciones
        if (this.id_servicios.length > 0) {
          console.log('Servicios a asignar:', this.id_servicios);
          const observables = this.id_servicios.map(id_serv => {
            const relacion = {
              profesional: idProfesional,  // Cambiar de id_profesional a profesional
              servicio: id_serv  // Cambiar de id_servicio a servicio
            };
            console.log('Creando relación profesional-servicio:', relacion);
            return this.profesionalServicioService.crearRelacion(relacion);
          });

          forkJoin(observables).subscribe({
            next: () => {
              this.alertService.success('Profesional creado exitosamente con sus servicios');
              this.router.navigate(['/admin/profesionales']);
            },
            error: (errRel) => {
              console.error('Error al asignar servicios:', errRel);
              this.alertService.warning('Profesional creado, pero hubo un error al asignar los servicios');
              this.router.navigate(['/admin/profesionales']);
            }
          });
        } else {
          // Si no hay servicios, simplemente confirmar la creación
          this.alertService.success('Profesional creado exitosamente. Puedes asignarle servicios editando su perfil.');
          this.router.navigate(['/admin/profesionales']);
        }
      },
      error: (err) => {
        console.error('Error completo:', err);
        const mensaje = err.error?.error || err.message || 'Error al crear el profesional';
        this.alertService.error('Error: ' + mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/profesionales']);
  }
}
