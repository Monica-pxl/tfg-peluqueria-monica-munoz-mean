import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorariosProfesionalComponent } from './horarios-profesional-component';

describe('HorariosProfesionalComponent', () => {
  let component: HorariosProfesionalComponent;
  let fixture: ComponentFixture<HorariosProfesionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosProfesionalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorariosProfesionalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
