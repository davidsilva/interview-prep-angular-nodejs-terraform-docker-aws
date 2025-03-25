import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MockProductsService } from '../../mocks/mock-products.service';
import { ProductsUpdateComponent } from './products-update.component';
import { ProductsService } from '../../services/products.service';
import { routes } from '../../../app.routes';
import {
  Product,
  ProductStatus,
} from '@onyxdevtutorials/interview-prep-shared';
import { mockProducts } from '../../mocks/mock-products';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('ProductsUpdateComponent', () => {
  let component: ProductsUpdateComponent;
  let fixture: ComponentFixture<ProductsUpdateComponent>;
  let mockProductsService: MockProductsService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsUpdateComponent, BrowserAnimationsModule, MatSnackBarModule],
      providers: [
        provideRouter(routes),
        { provide: ProductsService, useClass: MockProductsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsUpdateComponent);

    // One method of setting the productId input. The other is the TestHost method.
    fixture.componentRef.setInput('productId', '1');

    component = fixture.componentInstance;
    mockProductsService = TestBed.inject(
      ProductsService
    ) as unknown as MockProductsService;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ProductsService and MatSnackBar', () => {
    expect(component.productsService).toBeDefined();
    expect(component.snackBar).toBeDefined();
  });

  it('should call updateProduct on ProductsService when handleFormSubmit is called', () => {
    const formData = {
      name: 'Product 1',
      description: 'Product 1 description',
      price: 100,
      status: ProductStatus.AVAILABLE,
    } as Omit<Product, 'id'>;

    const mockProduct = mockProducts[0];

    spyOn(mockProductsService, 'getProduct').and.returnValue(of(mockProduct));

    component.ngOnInit();
    expect(component.productData).toEqual(mockProduct);

    spyOn(mockProductsService, 'updateProduct').and.returnValue(
      of({
        ...formData,
        id: 1,
        version: 2,
      })
    );

    component.handleFormSubmit(formData);

    expect(mockProductsService.updateProduct).toHaveBeenCalledWith(
      '1',
      {...formData,
      version: 1},
    );
  });

  it('should navigate to /products on successful update', () => {
    const formData = {
      name: 'Product 1',
      description: 'Product 1 description',
      price: 100,
      status: ProductStatus.AVAILABLE,
    } as Omit<Product, 'id'>;

    const mockProduct = mockProducts[0];

    spyOn(mockProductsService, 'getProduct').and.returnValue(of(mockProduct));

    component.ngOnInit();
    expect(component.productData).toEqual(mockProduct);

    spyOn(mockProductsService, 'updateProduct').and.returnValue(
      of({
        ...formData,
        id: 1,
        version: 2,
      })
    );

    spyOn(router, 'navigate');

    component.handleFormSubmit(formData);

    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should log an error and display error in MatSnackBar when updateProduct fails', () => {
    const formData = {
      name: 'Product 1',
      description: 'Product 1 description',
      price: 100,
      status: ProductStatus.AVAILABLE,
    } as Omit<Product, 'id'>;

    const mockProduct = mockProducts[0];

    spyOn(mockProductsService, 'getProduct').and.returnValue(of(mockProduct));

    component.ngOnInit();
    expect(component.productData).toEqual(mockProduct);

    spyOn(mockProductsService, 'updateProduct').and.returnValue(
      throwError(() => new Error('Simulated network error'))
    );
    spyOn(component.snackBar, 'open');
    spyOn(console, 'error');

    component.handleFormSubmit(formData);

    expect(console.error).toHaveBeenCalledWith(
      'Error updating product:',
      new Error('Simulated network error')
    );

    expect(component.snackBar.open).toHaveBeenCalledWith(
      'Simulated network error',
      'Close',
      {
        duration: 5000,
      }
    );
  });

  it('should set productData on init', () => {
    spyOn(mockProductsService, 'getProduct').and.callThrough();

    component.ngOnInit();

    expect(component.productData).toEqual(mockProducts[0]);
  });

  it('should log an error when getProduct fails', () => {
    spyOn(mockProductsService, 'getProduct').and.returnValue(
      throwError(() => new Error('Simulated network error'))
    );

    spyOn(component.snackBar, 'open');
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith(
      'Error getting product:',
      new Error('Simulated network error')
    );

    expect(component.snackBar.open).toHaveBeenCalledWith(
      'Simulated network error',
      'Close',
      {
        duration: 5000,
      }
    );
  });
});
