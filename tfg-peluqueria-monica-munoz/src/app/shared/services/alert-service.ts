import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  autoClose: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new BehaviorSubject<Alert | null>(null);
  public alert$ = this.alertSubject.asObservable();

  success(message: string, autoClose: boolean = true) {
    this.showAlert('success', message, autoClose);
  }

  error(message: string, autoClose: boolean = true) {
    this.showAlert('error', message, autoClose);
  }

  warning(message: string, autoClose: boolean = true) {
    this.showAlert('warning', message, autoClose);
  }

  info(message: string, autoClose: boolean = true) {
    this.showAlert('info', message, autoClose);
  }

  private showAlert(type: Alert['type'], message: string, autoClose: boolean) {
    const alert: Alert = {
      id: this.generateId(),
      type,
      message,
      autoClose
    };
    
    this.alertSubject.next(alert);

    if (autoClose) {
      setTimeout(() => {
        this.clear();
      }, 4000);
    }
  }

  clear() {
    this.alertSubject.next(null);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
