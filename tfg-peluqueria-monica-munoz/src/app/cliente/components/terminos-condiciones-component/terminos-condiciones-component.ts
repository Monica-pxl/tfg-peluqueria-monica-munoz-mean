import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-terminos-condiciones-component',
  imports: [],
  templateUrl: './terminos-condiciones-component.html',
  styleUrl: './terminos-condiciones-component.css',
})
export class TerminosCondicionesComponent implements OnInit {
  ngOnInit(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }
}
