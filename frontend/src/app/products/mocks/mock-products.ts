import {
  Product,
  ProductStatus,
} from '@onyxdevtutorials/interview-prep-shared';

export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Product 1',
    price: 1000,
    description: 'Description 1',
    created_at: new Date(),
    updated_at: new Date(),
    status: ProductStatus.AVAILABLE,
    version: 1,
  },
  {
    id: 2,
    name: 'Product 2',
    price: 2000,
    description: 'Description 2',
    created_at: new Date(),
    updated_at: new Date(),
    status: ProductStatus.AVAILABLE,
    version: 1,
  },
];
