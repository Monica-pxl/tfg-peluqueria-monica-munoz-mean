import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-politica-privacidad-component',
  imports: [],
  templateUrl: './politica-privacidad-component.html',
  styleUrl: './politica-privacidad-component.css',
})
export class PoliticaPrivacidadComponent implements OnInit {
  ngOnInit(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }
}
