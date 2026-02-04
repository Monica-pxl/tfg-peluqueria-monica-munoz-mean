import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmDialog } from '../../services/confirm-service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrl: './confirm.component.css'
})
export class ConfirmComponent implements OnInit, OnDestroy {
  dialog: ConfirmDialog | null = null;
  private subscription!: Subscription;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit() {
    this.subscription = this.confirmService.confirm$.subscribe(dialog => {
      this.dialog = dialog;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  confirm() {
    this.confirmService.handleConfirm();
  }

  cancel() {
    this.confirmService.handleCancel();
  }

  getIcon(): string {
    if (this.dialog?.variant === 'info' || this.dialog?.variant === 'client') {
      return 'bi-info-circle-fill';
    }
    if (this.dialog?.variant === 'professional') {
      return 'bi-person-fill-check';
    }
    if (this.dialog?.variant === 'admin') {
      return 'bi-shield-fill-check';
    }
    return 'bi-question-circle-fill';
  }
}
