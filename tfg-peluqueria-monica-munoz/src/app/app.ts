import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./cliente/components/navbar-component/navbar-component";
import { FooterComponent } from "./cliente/components/footer-component/footer-component";
import { AlertComponent } from "./shared/components/alert/alert.component";
import { ConfirmComponent } from "./shared/components/confirm/confirm.component";
import { AvisoPrivacidadComponent } from "./shared/components/aviso-privacidad/aviso-privacidad.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AlertComponent, ConfirmComponent, AvisoPrivacidadComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('tfg-peluqueria-monica-munoz');
}
