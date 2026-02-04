import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error404-component',
  imports: [RouterLink],
  templateUrl: './error404-component.html',
  styleUrl: './error404-component.css',
})
export class Error404Component {
  constructor(private location: Location) {}

  volver(): void {
    this.location.back();
  }
}
