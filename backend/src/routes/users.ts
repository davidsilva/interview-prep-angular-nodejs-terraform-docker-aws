import { Router, Request, Response, NextFunction } from 'express';
import { User } from '@onyxdevtutorials/interview-prep-shared';
import {
  userSchema,
  userPatchSchema,
  userCreateSchema,
} from '../validation/userSchema';
import { ValidationError } from '../errors/ValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import { ConflictError } from '../errors/ConflictError';
import { requireGroup } from '../middleware/authMiddleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db;
    const users: User[] = await db.select('*').from('users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
});

// Get individual user
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const db = req.db;
    const user: User = await db('users').where({ id }).first();
    if (!user) {
      return next(new NotFoundError('User not found'));
    } else {
      if (!user.version) {
        user.version = 1;
      }
      res.json(user);
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    // res.status(500).send('Error fetching user');
    next(error);
  }
});

router.post(
  '/',
  requireGroup(['AdminUsers']),
  async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = userCreateSchema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }

    try {
      const db = req.db;
      const userToInsert = { ...value, version: 1 };
      const [user]: User[] = await db('users')
        .insert(userToInsert)
        .returning('*');
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      next(error);
    }
  }
);

router.put(
  '/:id',
  requireGroup(['AdminUsers']), // Ensure only AdminUsers can update users
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }

    if (!value.version) {
      return next(new ValidationError('Version is required'));
    }

    try {
      const db = req.db;
      const currentUser = await db('users').where({ id }).first();

      if (!currentUser) {
        return next(new NotFoundError('User not found'));
      }

      if (value.version !== currentUser.version) {
        return next(
          new ConflictError(
            'Conflict: User has been updated by another process. Please reload the page and try again.'
          )
        );
      }

      const updatedUser = {
        ...value,
        version: currentUser.version + 1,
      };

      // If we don't find a user with the id and "current" version, we know that the user has been updated by another request.
      const [user]: User[] = await db('users')
        .where({ id, version: currentUser.version })
        .update(updatedUser)
        .returning('*');

      if (!user) {
        return next(
          new ConflictError(
            'Conflict: User has been updated by another process. Please reload the page and try again.'
          )
        );
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      next(error);
    }
  }
);

// Patch user
// Remember that PATCH is used to update a subset of fields on a resource, while PUT is used to update the entire resource.
router.patch(
  '/:id',
  requireGroup(['AdminUsers']), // Ensure only AdminUsers can update users
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { error, value } = userPatchSchema.validate(req.body, {
      presence: 'optional',
    });
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }

    if (!value.version) {
      return next(new ValidationError('Version is required'));
    }

    try {
      const db = req.db;
      const currentUser = await db('users').where({ id }).first();

      if (!currentUser) {
        return next(new NotFoundError('User not found'));
      }

      if (value.version !== currentUser.version) {
        return next(
          new ConflictError(
            'Conflict: User has been updated by another process. Please reload the page and try again.'
          )
        );
      }

      const updatedUser = {
        ...currentUser,
        ...value,
        version: currentUser.version + 1,
      };

      // If we don't find a user with the id and "current" version, we know that the user has been updated by another request.
      const [user]: User[] = await db('users')
        .where({ id, version: currentUser.version })
        .update(updatedUser)
        .returning('*');

      if (!user) {
        return next(
          new ConflictError(
            'Conflict: User has been updated by another process. Please reload the page and try again.'
          )
        );
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      next(error);
    }
  }
);

// Delete user
router.delete(
  '/:id',
  requireGroup(['AdminUsers']), // Ensure only AdminUsers can delete users
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const db = req.db;
      const deletedUsers: User[] = await db('users')
        .where({ id })
        .del()
        .returning('*');
      if (!deletedUsers || deletedUsers.length === 0) {
        return next(new NotFoundError('User not found'));
      } else {
        res.status(204).json(deletedUsers[0]);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      next(error);
    }
  }
);

export default router;
