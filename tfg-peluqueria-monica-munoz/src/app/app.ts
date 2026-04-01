import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
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
export class App implements OnInit {
  protected readonly title = signal('tfg-peluqueria-monica-munoz');

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
          setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }, 0);
        });
    }
  }
}
