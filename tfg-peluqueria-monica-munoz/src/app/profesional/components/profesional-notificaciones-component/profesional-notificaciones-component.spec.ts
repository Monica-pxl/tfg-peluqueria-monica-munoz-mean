import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfesionalNotificacionesComponent } from './profesional-notificaciones-component';

describe('ProfesionalNotificacionesComponent', () => {
  let component: ProfesionalNotificacionesComponent;
  let fixture: ComponentFixture<ProfesionalNotificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesionalNotificacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfesionalNotificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
