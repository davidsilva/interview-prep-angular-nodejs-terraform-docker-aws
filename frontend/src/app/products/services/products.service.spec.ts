import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { mockProducts } from '../mocks/mock-products';
import { ProductsService } from './products.service';
import {
  Product,
  ProductStatus,
} from '@onyxdevtutorials/interview-prep-shared';
import { environment } from '../../../environments/environment';

const apiBaseUrl = environment.apiBaseUrl;
const productsPath = `${apiBaseUrl}/products`;

describe('ProductsService', () => {
  let service: ProductsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductsService,
      ],
    });

    service = TestBed.inject(ProductsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch products', () => {
    service.getProducts().subscribe((products) => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpTestingController.expectOne(
      productsPath
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('should fetch a product', () => {
    service.getProduct('1').subscribe((product) => {
      expect(product).toEqual(mockProducts[0]);
    });

    const req = httpTestingController.expectOne(
      `${productsPath}/1`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts[0]);
  });

  it('should update a product', () => {
    const updatedProduct = {
      ...mockProducts[0],
      name: 'Updated Product 1',
    };

    service.updateProduct('1', updatedProduct).subscribe((product) => {
      expect(product).toEqual(updatedProduct);
    });

    const req = httpTestingController.expectOne(
      `${productsPath}/1`
    );
    expect(req.request.method).toBe('PUT');
    req.flush(updatedProduct);
  });

  it('should create a product', () => {
    const newProduct: Omit<Product, 'id'> = {
      name: 'New Product',
      price: 3000,
      description: 'New Description',
      status: ProductStatus.AVAILABLE,
    };

    service.createProduct(newProduct).subscribe((product) => {
      expect(product).toEqual({ ...newProduct, id: 3 });
    });

    const req = httpTestingController.expectOne(
      productsPath
    );
    expect(req.request.method).toBe('POST');
    req.flush({ ...newProduct, id: 3 });
  });

  it('should convert price to cents', () => {
    expect(service.convertPriceToCents(10)).toBe(1000);
  });
});
