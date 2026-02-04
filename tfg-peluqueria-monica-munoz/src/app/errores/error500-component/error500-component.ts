import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error500-component',
  imports: [RouterLink],
  templateUrl: './error500-component.html',
  styleUrl: './error500-component.css',
})
export class Error500Component {
  recargar(): void {
    window.location.reload();
  }
}
