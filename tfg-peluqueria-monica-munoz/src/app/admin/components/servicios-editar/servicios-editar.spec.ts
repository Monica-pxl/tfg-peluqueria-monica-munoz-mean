import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosEditar } from './servicios-editar';

describe('ServiciosEditar', () => {
  let component: ServiciosEditar;
  let fixture: ComponentFixture<ServiciosEditar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosEditar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosEditar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
