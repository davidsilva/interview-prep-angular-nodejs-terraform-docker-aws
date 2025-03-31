import { Request, Response, NextFunction } from 'express';

export const mockAttachUserGroups = jest.fn(
  () => (req: Request, res: Response, next: NextFunction) => {
    // console.log(
    //   'Mocked attachUserGroups middleware req.headers.authorization:',
    //   req.headers.authorization
    // );
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      // If no token is provided, proceed to the next middleware
      return next();
    }

    // Simulate decoding the token and attaching user groups
    if (token === 'valid-token-with-admin') {
      // Simulate an admin user
      req.userGroups = ['AdminUsers'];
    } else if (token === 'valid-token-without-groups') {
      req.userGroups = []; // No user groups
    } else {
      // Simulate an invalid token
      return res.status(401).json({
        message: 'Unauthorized: Invalid or expired token',
      });
    }

    next(); // Proceed to the next middleware
  }
);
