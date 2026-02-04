import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentrosCrear } from './centros-crear';

describe('CentrosCrear', () => {
  let component: CentrosCrear;
  let fixture: ComponentFixture<CentrosCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentrosCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentrosCrear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
