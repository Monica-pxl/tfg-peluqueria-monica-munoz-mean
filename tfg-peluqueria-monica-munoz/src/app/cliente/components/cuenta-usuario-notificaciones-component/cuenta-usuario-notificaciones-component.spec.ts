import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaUsuarioNotificacionesComponent } from './cuenta-usuario-notificaciones-component';

describe('CuentaUsuarioNotificacionesComponent', () => {
  let component: CuentaUsuarioNotificacionesComponent;
  let fixture: ComponentFixture<CuentaUsuarioNotificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaUsuarioNotificacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaUsuarioNotificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
