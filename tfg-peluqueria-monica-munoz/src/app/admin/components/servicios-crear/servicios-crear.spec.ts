import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosCrear } from './servicios-crear';

describe('ServiciosCrear', () => {
  let component: ServiciosCrear;
  let fixture: ComponentFixture<ServiciosCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosCrear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
