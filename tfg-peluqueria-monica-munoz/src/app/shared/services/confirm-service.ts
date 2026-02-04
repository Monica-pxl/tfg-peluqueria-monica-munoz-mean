import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info' | 'professional' | 'admin' | 'client';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new BehaviorSubject<ConfirmDialog | null>(null);
  public confirm$ = this.confirmSubject.asObservable();
  
  private resolveCallback: ((value: boolean) => void) | null = null;

  confirm(title: string, message: string, confirmText: string = 'Confirmar', cancelText: string = 'Cancelar', variant: 'danger' | 'info' | 'professional' | 'admin' | 'client' = 'danger'): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      this.confirmSubject.next({
        title,
        message,
        confirmText,
        cancelText,
        variant
      });
    });
  }

  handleConfirm() {
    if (this.resolveCallback) {
      this.resolveCallback(true);
      this.resolveCallback = null;
    }
    this.confirmSubject.next(null);
  }

  handleCancel() {
    if (this.resolveCallback) {
      this.resolveCallback(false);
      this.resolveCallback = null;
    }
    this.confirmSubject.next(null);
  }
}
