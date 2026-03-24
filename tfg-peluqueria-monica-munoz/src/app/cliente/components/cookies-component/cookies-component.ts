import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookies-component',
  imports: [],
  templateUrl: './cookies-component.html',
  styleUrl: './cookies-component.css',
})
export class CookiesComponent implements OnInit {
  ngOnInit(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }
}
