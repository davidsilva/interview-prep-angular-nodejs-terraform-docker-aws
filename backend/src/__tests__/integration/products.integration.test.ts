import request from 'supertest';
import app from '../../app';
import knex from 'knex';
import knexConfig from '../../knexFile';
import {
  Product,
  ProductStatus,
} from '@onyxdevtutorials/interview-prep-shared';
import retry from 'retry';

const db = knex(knexConfig['test_products']);

const productsPath = '/products';

const waitForDb = async (): Promise<void> => {
  const operation = retry.operation({
    retries: 10,
    factor: 2,
    minTimeout: 2000,
    maxTimeout: 10000,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        await db.raw('SELECT 1');
        resolve();
      } catch (error) {
        if (operation.retry(error as Error)) {
          return;
        }
        reject(error);
      }
    });
  });
};

beforeAll(async () => {
  await waitForDb();

  await db.migrate.latest();

  await db.seed.run();

  app.set('db', db);

  const products = await db('products').select('*');
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  jest.clearAllMocks();

  await db.raw('BEGIN');
});

afterEach(async () => {
  await db.raw('ROLLBACK');
});

describe('GET /api/v0/products', () => {
  it('should return a list of products', async () => {
    const response = await request(app).get(productsPath);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should handle an error', async () => {
    jest.spyOn(db, 'select').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const response = await request(app).get(productsPath);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Database error' });
  });
});

describe('GET /api/v0/products/:id', () => {
  it('should return a single product', async () => {
    const response = await request(app).get(`${productsPath}/1`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it('should return a 404 for a non-existent product', async () => {
    const response = await request(app).get(`${productsPath}/999`);
    expect(response.status).toBe(404);
  });

  it.todo('should handle non-404 errors');
});

describe('POST /api/v0/products', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const newProduct: Omit<Product, 'id'> = {
      name: 'New Product',
      price: 100,
      description: 'New product description',
      status: ProductStatus.AVAILABLE,
    };
    const response = await request(app).post(productsPath).send(newProduct);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Unauthorized: No user groups found',
    });
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const newProduct: Omit<Product, 'id'> = {
      name: 'New Product',
      price: 100,
      description: 'New product description',
      status: ProductStatus.AVAILABLE,
    };

    const response = await request(app)
      .post(productsPath)
      .set('Authorization', `Bearer ${token}`)
      .send(newProduct);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: You do not have permission to access this resource',
    });
  });

  it('should create a new product', async () => {
    const token = 'valid-token-with-admin';
    const newProduct: Omit<Product, 'id'> = {
      name: 'New Product',
      price: 100,
      description: 'New product description',
      status: ProductStatus.AVAILABLE,
    };

    const response = await request(app)
      .post(productsPath)
      .set('Authorization', `Bearer ${token}`)
      .send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(newProduct.name);
    expect(response.body.price).toBe(newProduct.price);
    expect(response.body.status).toBe(newProduct.status);
  });

  it('should return a 400 for a product with missing fields', async () => {
    const token = 'valid-token-with-admin';
    const newProduct: Omit<Product, 'id' | 'description'> = {
      name: 'New Product',
      price: 100,
      status: ProductStatus.AVAILABLE,
    };

    const response = await request(app)
      .post(productsPath)
      .set('Authorization', `Bearer ${token}`)
      .send(newProduct);

    expect(response.status).toBe(400);
  });

  it.todo('should handle non-400 (non-validation) errors');
});

describe('PUT /api/v0/products/:id', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const updatedProduct: Omit<Product, 'id'> = {
      name: 'Updated Product',
      price: 200,
      description: 'Updated product description',
      status: ProductStatus.AVAILABLE,
    };
    const response = await request(app)
      .put(`${productsPath}/1`)
      .send(updatedProduct);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Unauthorized: No user groups found',
    });
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const updatedProduct: Omit<Product, 'id'> = {
      name: 'Updated Product',
      price: 200,
      description: 'Updated product description',
      status: ProductStatus.AVAILABLE,
    };
    const response = await request(app)
      .put(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: You do not have permission to access this resource',
    });
  });

  it('should update an existing product', async () => {
    const token = 'valid-token-with-admin';
    const updatedProduct: Omit<Product, 'id'> = {
      name: 'Updated Product',
      price: 200,
      description: 'Updated product description',
      status: ProductStatus.AVAILABLE,
      version: 1,
    };

    const response = await request(app)
      .put(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updatedProduct.name);
    expect(response.body.price).toBe(updatedProduct.price);
    expect(response.body.description).toBe(updatedProduct.description);
    expect(response.body.status).toBe(updatedProduct.status);
    expect(response.body.version).toBe(2);
  });

  it('should return a 400 for a product with missing fields', async () => {
    const token = 'valid-token-with-admin';
    const updatedProduct: Omit<Product, 'id' | 'description'> = {
      name: 'Updated Product',
      price: 200,
      status: ProductStatus.AVAILABLE,
      version: 1,
    };

    const response = await request(app)
      .put(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);

    expect(response.status).toBe(400);
  });

  it('should return a 404 for a non-existent product', async () => {
    const token = 'valid-token-with-admin';
    const updatedProduct: Omit<Product, 'id'> = {
      name: 'Updated Product',
      price: 200,
      description: 'Updated product description',
      status: ProductStatus.AVAILABLE,
      version: 1,
    };

    const response = await request(app)
      .put(`${productsPath}/999`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);

    expect(response.status).toBe(404);
  });

  it('PUT should return a 409 conflict when there is a version mismatch', async () => {
    const token = 'valid-token-with-admin';
    const product: Omit<Product, 'id'> = {
      name: 'Original Product',
      price: 100,
      description: 'Original product description',
      status: ProductStatus.AVAILABLE,
    };

    const [createdProduct] = await db('products')
      .insert(product)
      .returning('*');

    const firstUpdate: Partial<Product> = {
      ...createdProduct,
      name: 'First Update',
    };

    const firstResponse = await request(app)
      .put(`${productsPath}/${createdProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(firstUpdate);

    expect(firstResponse.status).toBe(200);

    // Intentionally create a version mismatch
    const secondUpdate: Partial<Product> = {
      ...createdProduct,
      name: 'Second Update',
      version: createdProduct.version,
    };

    const secondResponse = await request(app)
      .put(`${productsPath}/${createdProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(secondUpdate);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe(
      'Conflict: Product has been updated by another request. Please reload the page and try again.'
    );
  });

  it.todo('should handle other errors');
});

describe('PATCH /api/v0/products/:id', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const updatedProduct: Partial<Product> = {
      name: 'Updated Product',
      price: 200,
      description: 'Updated product description',
      status: ProductStatus.AVAILABLE,
      version: 1,
    };
    const response = await request(app)
      .patch(`${productsPath}/1`)
      .send(updatedProduct);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Unauthorized: No user groups found',
    });
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const updatedProduct: Partial<Product> = {
      name: 'Updated Product',
      price: 200,
      description: 'Updated product description',
      status: ProductStatus.AVAILABLE,
      version: 1,
    };
    const response = await request(app)
      .patch(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: You do not have permission to access this resource',
    });
  });

  it('should update an existing product', async () => {
    const token = 'valid-token-with-admin';
    const updatedProduct: Partial<Product> = {
      name: 'Updated Product',
      version: 1,
    };

    const response = await request(app)
      .patch(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updatedProduct.name);
    expect(response.body.version).toBe(2);
  });

  it('should not return a 400 for a product with "missing" fields (should return 200)', async () => {
    const token = 'valid-token-with-admin';
    const updatedProduct: Partial<Product> = {
      name: 'Updated Product',
      description: 'Updated Product Description',
      version: 1,
    };

    const response = await request(app)
      .patch(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);

    expect(response.status).toBe(200);
  });

  it('should return a 404 for a non-existent product', async () => {
    const token = 'valid-token-with-admin';
    const updatedProduct: Partial<Product> = {
      name: 'Updated Product',
      version: 1,
    };

    const response = await request(app)
      .patch(`${productsPath}/999`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedProduct);

    expect(response.status).toBe(404);
  });

  it('should return a 409 conflict when there is a version mismatch', async () => {
    const token = 'valid-token-with-admin';
    const product: Omit<Product, 'id'> = {
      name: 'Original Product',
      price: 100,
      description: 'Original product description',
      status: ProductStatus.AVAILABLE,
      version: 1,
    };

    const [createdProduct] = await db('products')
      .insert(product)
      .returning('*');

    const firstUpdate: Partial<Product> = {
      name: 'First Update',
      version: createdProduct.version,
    };

    const firstResponse = await request(app)
      .patch(`${productsPath}/${createdProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(firstUpdate);

    expect(firstResponse.status).toBe(200);

    // Intentionally create a version mismatch
    const secondUpdate: Partial<Product> = {
      name: 'Second Update',
      version: createdProduct.version,
    };

    const secondResponse = await request(app)
      .patch(`${productsPath}/${createdProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(secondUpdate);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe(
      'Conflict: Product has been updated by another request. Please reload the page and try again.'
    );
  });

  it.todo("should handle a validation error if field isn't in schema at all");

  it.todo('should handle other errors');
});

describe('DELETE /api/v0/products/:id', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const response = await request(app).delete(`${productsPath}/1`);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Unauthorized: No user groups found',
    });
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const response = await request(app)
      .delete(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: You do not have permission to access this resource',
    });
  });

  it('should delete an existing product', async () => {
    const token = 'valid-token-with-admin';
    const response = await request(app)
      .delete(`${productsPath}/1`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(204);
  });

  it('should return a 404 for a non-existent product', async () => {
    const token = 'valid-token-with-admin';
    const response = await request(app)
      .delete(`${productsPath}/999`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it.todo('should handle other errors');
});
