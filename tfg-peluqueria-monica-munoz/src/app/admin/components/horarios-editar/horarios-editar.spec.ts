import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorariosEditar } from './horarios-editar';

describe('HorariosEditar', () => {
  let component: HorariosEditar;
  let fixture: ComponentFixture<HorariosEditar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosEditar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorariosEditar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
