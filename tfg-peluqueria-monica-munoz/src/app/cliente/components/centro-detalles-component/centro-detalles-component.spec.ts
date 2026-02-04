import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroDetallesComponent } from './centro-detalles-component';

describe('CentroDetallesComponent', () => {
  let component: CentroDetallesComponent;
  let fixture: ComponentFixture<CentroDetallesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroDetallesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentroDetallesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
