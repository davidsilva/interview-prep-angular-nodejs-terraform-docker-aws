import request from 'supertest';
import knex from 'knex';
import knexConfig from '../../knexFile';
import { User, UserStatus } from '@onyxdevtutorials/interview-prep-shared';
import retry from 'retry';
import app from '../../app';

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
  jest.clearAllMocks();

  await db.raw('BEGIN');
});

afterEach(async () => {
  await db.raw('ROLLBACK');
});

// GET is open to all users. Doesn't matter if they are authenticated or not or whether they belong to a group.
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

// The POST endpoint is protected by the requireGroup middleware, which means only users in the AdminUsers group can create a new user.
describe('POST /api/v0/users', () => {
  // No authorization header, no token, no groups
  it('should return a 401 if the user is not authenticated', async () => {
    const response = await request(app).post(usersPath).send({
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No user groups found');
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const response = await request(app)
      .post(usersPath)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'elvis.presley@graceland.com',
        first_name: 'Elvis',
        last_name: 'Presley',
        status: UserStatus.ACTIVE,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Forbidden: You do not have permission to access this resource'
    );
  });

  it('should create a new user', async () => {
    const token = 'valid-token-with-admin';
    const newUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
    };

    const response = await request(app)
      .post(usersPath)
      .set('Authorization', `Bearer ${token}`)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.email).toBe(newUser.email);
    expect(response.body.first_name).toBe(newUser.first_name);
    expect(response.body.last_name).toBe(newUser.last_name);
    expect(response.body.status).toBe(newUser.status);
    expect(response.body.version).toBe(1);
  });

  it('should return a 400 for a user with missing fields', async () => {
    const token = 'valid-token-with-admin';
    const newUser: Omit<User, 'id' | 'status'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
    };

    const response = await request(app)
      .post(usersPath)
      .set('Authorization', `Bearer ${token}`)
      .send(newUser);

    expect(response.status).toBe(400);
  });

  it.todo('should handle other errors');
});

// Only members of the AdminUsers group can update a user via PUT or PATCH.
describe('PUT /api/v0/users/:id', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const updatedUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const response = await request(app).put(`${usersPath}/1`).send(updatedUser);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No user groups found');
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const updatedUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const response = await request(app)
      .put(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Forbidden: You do not have permission to access this resource'
    );
  });

  it('should update an existing user', async () => {
    const token = 'valid-token-with-admin';
    const updatedUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const response = await request(app)
      .put(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(updatedUser.email);
    expect(response.body.first_name).toBe(updatedUser.first_name);
    expect(response.body.last_name).toBe(updatedUser.last_name);
    expect(response.body.status).toBe(updatedUser.status);
    expect(response.body.version).toBe(2);
  });

  it('should return 400 for a user with missing fields', async () => {
    const token = 'valid-token-with-admin';
    const updatedUser: Omit<User, 'id' | 'status'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
    };

    const response = await request(app)
      .put(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(400);
  });

  it('should return a 404 for a non-existent user', async () => {
    const token = 'valid-token-with-admin';
    const updatedUser: Omit<User, 'id'> = {
      email: 'elvis.presley@graceland.com',
      first_name: 'Elvis',
      last_name: 'Presley',
      status: UserStatus.ACTIVE,
      version: 1,
    };

    const response = await request(app)
      .put(`${usersPath}/999`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(404);
  });

  it('PUT should return a 409 for a user that has been updated by another request', async () => {
    const token = 'valid-token-with-admin';
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
      .send(secondUpdate);

    console.log('****** secondResponse:', secondResponse.body);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe(
      'Conflict: User has been updated by another process. Please reload the page and try again.'
    );
  });

  it.todo('should handle other errors');
});

describe('PATCH /api/v0/users/:id', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
      version: 1,
    };

    const response = await request(app)
      .patch(`${usersPath}/1`)
      .send(updatedUser);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No user groups found');
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
      version: 1,
    };

    const response = await request(app)
      .patch(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Forbidden: You do not have permission to access this resource'
    );
  });

  it('should update an existing user', async () => {
    const token = 'valid-token-with-admin';
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
      version: 1,
    };

    const response = await request(app)
      .patch(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(updatedUser.email);
  });

  // The only required field for a PATCH is the version field
  it('should return 400 for a user with "missing" fields', async () => {
    const token = 'valid-token-with-admin';
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
    };

    const response = await request(app)
      .patch(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(400);
  });

  it('should return a 404 for a non-existent user', async () => {
    const token = 'valid-token-with-admin';
    const updatedUser: Partial<User> = {
      email: 'elvis.presley@graceland.com',
      version: 1,
    };

    const response = await request(app)
      .patch(`${usersPath}/999`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);

    expect(response.status).toBe(404);
  });

  it('should return a 409 for a user that has been updated by another request', async () => {
    const token = 'valid-token-with-admin';
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
      .set('Authorization', `Bearer ${token}`)
      .send(firstUpdate);

    expect(firstResponse.status).toBe(200);

    // Intentionally create a version mismatch
    const secondUpdate: Partial<User> = {
      last_name: 'Smith',
      version: createdUser.version,
    };

    const secondResponse = await request(app)
      .patch(`${usersPath}/${createdUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(secondUpdate);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe(
      'Conflict: User has been updated by another process. Please reload the page and try again.'
    );
  });

  it.todo('should handle other errors');
});

// Only members of the AdminUsers group can delete a user. This is enforced by the requireGroup middleware.
describe('DELETE /api/v0/users/:id', () => {
  it('should return a 401 if the user is not authenticated', async () => {
    const response = await request(app).delete(`${usersPath}/1`);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No user groups found');
  });

  it('should return a 403 if the user is not in the AdminUsers group', async () => {
    const token = 'valid-token-without-groups';
    const response = await request(app)
      .delete(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Forbidden: You do not have permission to access this resource'
    );
  });

  it('should delete an existing user', async () => {
    const token = 'valid-token-with-admin';
    const response = await request(app)
      .delete(`${usersPath}/1`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(204);
  });

  it('should return a 404 for a non-existent user', async () => {
    const token = 'valid-token-with-admin';
    const response = await request(app)
      .delete(`${usersPath}/999`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it.todo('should handle other errors');
});
