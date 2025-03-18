import request from 'supertest';
import app from '../../app';
import knex from 'knex';
import knexConfig from '../../knexFile';
import { User, UserStatus } from '@onyxdevtutorials/interview-prep-shared';
import retry from "retry";

const db = knex(knexConfig['test_users']);

const usersPath = '/users';

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

  const users = await db('users').select('*');
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db.raw('BEGIN')
});

afterEach(async () => {
  await db.raw('ROLLBACK')
});

describe('GET /api/v0/users', () => {
  it('should return a list of users', async () => {
    const response = await request(app).get(`${usersPath}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it.todo('should handle an error');
});

describe('GET /api/v0/users/:id', () => {
  it('should return a single user', async () => {
    const response = await request(app).get(`${usersPath}/1`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it('should return a 404 for a non-existent user', async () => {
    const response = await request(app).get(`${usersPath}/999`);
    expect(response.status).toBe(404);
  });

  it.todo('should handle non-404 errors');
});

describe('POST /api/v0/users', () => {
  it('should create a new user', async () => {
    const newUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
    };

    const response = await request(app).post(usersPath).send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.email).toBe(newUser.email);
    expect(response.body.first_name).toBe(newUser.first_name);
    expect(response.body.last_name).toBe(newUser.last_name);
    expect(response.body.status).toBe(newUser.status);
    expect(response.body.version).toBe(1);
  });

  it('should return a 400 for a user with missing fields', async () => {
    const newUser: Omit<User, 'id' | 'status'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
    };

    const response = await request(app).post(usersPath).send(newUser);

    expect(response.status).toBe(400);
  });

  it.todo('should handle other errors');
});

describe('PUT /api/v0/users/:id', () => {
  it('should update an existing user', async () => {
    const updatedUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const response = await request(app).put(`${usersPath}/1`).send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(updatedUser.email);
    expect(response.body.first_name).toBe(updatedUser.first_name);
    expect(response.body.last_name).toBe(updatedUser.last_name);
    expect(response.body.status).toBe(updatedUser.status);
    expect(response.body.version).toBe(2);
  });

  it('should return 400 for a user with missing fields', async () => {
    const updatedUser: Omit<User, 'id' | 'status'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
    };

    const response = await request(app).put(`${usersPath}/1`).send(updatedUser);

    expect(response.status).toBe(400);
  });

  it('should return a 404 for a non-existent user', async () => {
    const updatedUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const response = await request(app).put(`${usersPath}/999`).send(updatedUser);

    expect(response.status).toBe(404);
  });

  it('PUT should return a 409 for a user that has been updated by another request', async () => {
    const user: Omit<User, 'id'> = {
      email: 'priscilla.presley@graceland.com',
      first_name: 'Priscilla',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
    };

    const [createdUser] = await db('users').insert(user).returning('*');

    console.log('****** createdUser:', createdUser);

    const firstUpdate: Partial<User> = {
      ...createdUser,
      last_name: 'Wagner',
      version: createdUser.version,
    };

    const firstResponse = await request(app)
      .put(`${usersPath}/${createdUser.id}`)
      .send(firstUpdate);

    console.log('****** firstResponse:', firstResponse.body);

    expect(firstResponse.status).toBe(200);

    // Intentionally create a version mismatch
    const secondUpdate: Partial<User> = {
      ...createdUser,
      last_name: 'Smith',
      version: createdUser.version,
    };

    const secondResponse = await request(app)
      .put(`${usersPath}/${createdUser.id}`)
      .send(secondUpdate);

    console.log('****** secondResponse:', secondResponse.body);
    
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe('Conflict: User has been updated by another process. Please reload the page and try again.');
  });

  it.todo('should handle other errors');
});

describe('PATCH /api/v0/users/:id', () => {
  it('should update an existing user', async () => {
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
      version: 1,
    };

    const response = await request(app).patch(`${usersPath}/1`).send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(updatedUser.email);
  });

  // The only required field for a PATCH is the version field
  it('should return 400 for a user with "missing" fields', async () => {
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
    };

    const response = await request(app).patch(`${usersPath}/1`).send(updatedUser);

    expect(response.status).toBe(400);
  });

  it('should return a 404 for a non-existent user', async () => {
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
      version: 1,
    };

    const response = await request(app).patch(`${usersPath}/999`).send(updatedUser);

    expect(response.status).toBe(404);
  });

  it('should return a 409 for a user that has been updated by another request', async () => {
    const user: Omit<User, 'id'> = {
      email: 'priscilla.presley@graceland.com',
      first_name: 'Priscilla',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const [createdUser] = await db('users').insert(user).returning('*');

    const firstUpdate: Partial<User> = {
      last_name: 'Wagner',
      version: createdUser.version,
    };

    const firstResponse = await request(app)
      .patch(`${usersPath}/${createdUser.id}`)
      .send(firstUpdate);

    expect(firstResponse.status).toBe(200);

    // Intentionally create a version mismatch
    const secondUpdate: Partial<User> = {
      last_name: 'Smith',
      version: createdUser.version,
    };

    const secondResponse = await request(app)
      .patch(`${usersPath}/${createdUser.id}`)
      .send(secondUpdate);
    
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe('Conflict: User has been updated by another process. Please reload the page and try again.');
  });

  it.todo('should handle other errors');
});

describe('DELETE /api/v0/users/:id', () => {
  it('should delete an existing user', async () => {
    const response = await request(app).delete(`${usersPath}/1`);
    expect(response.status).toBe(204);
  });

  it('should return a 404 for a non-existent user', async () => {
    const response = await request(app).delete(`${usersPath}/999`);
    expect(response.status).toBe(404);
  });

  it.todo('should handle other errors');
});
