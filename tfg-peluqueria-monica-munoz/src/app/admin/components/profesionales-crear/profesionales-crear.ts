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

  id_usuario: number = 0;
  id_centro: number = 0;
  id_servicios: number[] = [];

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
            // 1. Por id_usuario (si el profesional tiene id_usuario)
            const idsUsuariosConProfesional: number[] = profesionales
              .map(p => p.id_usuario)
              .filter((id): id is number => id !== undefined && id !== null);

            console.log('IDs de usuarios con profesional:', idsUsuariosConProfesional);

            // 2. Por coincidencia de nombre completo
            const nombresCompletosConProfesional = profesionales.map(p =>
              `${p.nombre} ${p.apellidos}`.toLowerCase().trim()
            );

            this.usuariosProfesionales = usuarios.filter(u => {
              if (u.rol !== 'profesional') return false;

              // Excluir si el id_usuario ya está en profesionales
              if (u.id_usuario && idsUsuariosConProfesional.includes(u.id_usuario)) {
                console.log(`Excluyendo usuario ${u.nombre} (id: ${u.id_usuario}) - ya tiene profesional por ID`);
                return false;
              }

              // Excluir si el nombre completo coincide con algún profesional
              const nombreUsuario = u.nombre.toLowerCase().trim();
              if (nombresCompletosConProfesional.includes(nombreUsuario)) {
                console.log(`Excluyendo usuario ${u.nombre} (id: ${u.id_usuario}) - ya existe profesional con ese nombre`);
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
      this.serviciosFiltrados = this.servicios.filter(s => Number(s.id_centro) === Number(this.id_centro));
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
    const usuario = this.usuariosProfesionales.find(u => u.id_usuario === Number(this.id_usuario));
    if (!usuario) {
      this.alertService.error('Usuario no encontrado');
      return;
    }

    // Separar el nombre completo en nombre y apellidos
    const nombreCompleto = usuario.nombre.split(' ');
    const nombre = nombreCompleto[0];
    const apellidos = nombreCompleto.slice(1).join(' ') || '';

    const nuevoProfesional = {
      id_usuario: Number(this.id_usuario),
      nombre: nombre,
      apellidos: apellidos,
      id_centro: Number(this.id_centro)
    };

    console.log('Creando profesional:', nuevoProfesional);

    this.profesionalesService.crearProfesional(nuevoProfesional).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        const idProfesional = response.profesional.id_profesional;

        // Si hay servicios seleccionados, crear las relaciones
        if (this.id_servicios.length > 0) {
          const observables = this.id_servicios.map(id_serv => {
            return this.profesionalServicioService.crearRelacion({
              id_profesional: idProfesional,
              id_servicio: Number(id_serv)
            });
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
