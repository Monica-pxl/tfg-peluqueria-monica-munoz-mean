import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentrosEditar } from './centros-editar';

describe('CentrosEditar', () => {
  let component: CentrosEditar;
  let fixture: ComponentFixture<CentrosEditar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentrosEditar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentrosEditar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
