import { Component, inject, input } from '@angular/core';
import { ProductsFormComponent } from '../products-form/products-form.component';
import { ProductsService } from '../../services/products.service';
import { Product } from '@onyxdevtutorials/interview-prep-shared';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-products-update',
  standalone: true,
  imports: [ProductsFormComponent],
  templateUrl: './products-update.component.html',
  styleUrl: './products-update.component.scss',
})
export class ProductsUpdateComponent {
  productsService = inject(ProductsService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  productId = input.required<string>();

  productData: Product | null = null;
  loading = true;

  handleFormSubmit(formData: Omit<Product, 'id'>): void {
    console.log(formData);
    if (this.productData) {
      const productToUpdate = { ...formData, version: this.productData.version } as Product;
    this.productsService.updateProduct(this.productId(), productToUpdate).subscribe({
      next: (product) => {
        console.log('Product updated:', product);
        this.router.navigate(['/products']);
      },
      error: (error) => {
        const errorMessage = (error as Error).message;
        console.error('Error updating product:', error);
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
        });
      },
      complete: () => console.log('Product update complete'),
    });
    }
  }

  ngOnInit(): void {
    this.productsService.getProduct(this.productId()).subscribe({
      next: (product) => {
        console.log('products-update component Product:', product);
        this.productData = product;
        this.loading = false;
      },
      error: (error) => {
        const errorMessage = (error as Error).message;
        console.error('Error getting product:', error);
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000
        });
        this.loading = false;
      },
      complete: () => console.log('Product retrieval complete'),
    });
  }
}
