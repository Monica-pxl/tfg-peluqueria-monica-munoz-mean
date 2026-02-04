import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService, Alert } from '../../services/alert-service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent implements OnInit, OnDestroy {
  alert: Alert | null = null;
  private subscription!: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.subscription = this.alertService.alert$.subscribe(alert => {
      this.alert = alert;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  close() {
    this.alertService.clear();
  }

  getIcon(): string {
    switch (this.alert?.type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-x-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }

  getTitle(): string {
    switch (this.alert?.type) {
      case 'success':
        return '¡Éxito!';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Atención';
      case 'info':
        return 'Información';
      default:
        return 'Notificación';
    }
  }
}
