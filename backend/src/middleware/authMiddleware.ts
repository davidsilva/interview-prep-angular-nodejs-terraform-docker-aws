import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request, Response, NextFunction } from 'express';

if (!process.env['COGNITO_USER_POOL_ID'] || !process.env['COGNITO_CLIENT_ID']) {
  throw new Error('Required environment variables not set');
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env['COGNITO_USER_POOL_ID'],
  clientId: process.env['COGNITO_CLIENT_ID'],
  tokenUse: 'id', // or 'access' for access tokens
});

// IMPORTANT NOTE: Normally you don't want to give away information that could help an attacker -- like telling them why their request failed. But right now I want to be able to debug more easily.

// If the user is not signed in, the userGroups property is not attached at all, lest it imply is signed but simply doesn't belong to any group.
export const attachUserGroups = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Authorization header typically follows this format:
    // Authorization: Bearer <token>
    // console.log(
    //   'attachUserGroups middleware req.headers.authorization:',
    //   req.headers.authorization
    // );
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(); // Proceed to the next middleware if no token is provided. This allows for public access if no auth is required.
    }

    try {
      const payload = await verifier.verify(token);

      const groups = payload['cognito:groups'] || [];
      req.userGroups = groups;
      next();
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific errors if needed
        console.error('Error verifying token:', error.message);
        res.status(401).json({
          message: 'Unauthorized: Invalid or expired token',
          error: error.message, // For debugging purposes
        });
      }

      // Fallback error handling
      console.error('Error verifying token:', error);
      res.status(401).json({
        message: 'Unauthorized: Invalid or expired token',
        error: String(error), // For debugging purposes
      });
    }
  };
};

// User must belong to at least one of the allowedGroups.
// Express middleware should return void or call next().
export const requireGroup = (allowedGroups: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if userGroups is present in the request
    // console.log('req', req);
    if (!req.userGroups) {
      res.status(401).json({
        message: 'Unauthorized: No user groups found',
      });
      return;
    }

    // Check if the user belongs to any of the allowed groups
    const hasAccess = req.userGroups.some((group) =>
      allowedGroups.includes(group)
    );

    if (!hasAccess) {
      res.status(403).json({
        message:
          'Forbidden: You do not have permission to access this resource',
      });
      return;
    }

    next(); // Proceed to the next middleware/route handler
  };
};
