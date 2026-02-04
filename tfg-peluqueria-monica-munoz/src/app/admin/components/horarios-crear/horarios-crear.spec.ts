import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorariosCrear } from './horarios-crear';

describe('HorariosCrear', () => {
  let component: HorariosCrear;
  let fixture: ComponentFixture<HorariosCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorariosCrear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
