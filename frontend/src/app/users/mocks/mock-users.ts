import { User, UserStatus } from '@onyxdevtutorials/interview-prep-shared';

export const mockUsers: User[] = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@xyz.com',
    status: UserStatus.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
    version: 1,
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@xyz.com',
    status: UserStatus.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
    version: 1,
  },
];
