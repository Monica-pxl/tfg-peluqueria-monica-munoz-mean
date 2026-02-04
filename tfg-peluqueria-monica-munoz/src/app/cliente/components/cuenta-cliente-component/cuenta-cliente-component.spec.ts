import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaClienteComponent } from './cuenta-cliente-component';

describe('CuentaClienteComponent', () => {
  let component: CuentaClienteComponent;
  let fixture: ComponentFixture<CuentaClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
