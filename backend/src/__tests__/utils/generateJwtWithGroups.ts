import jwt from 'jsonwebtoken';

/**
 * Generates a JWT with specified user groups for testing purposes.
 * @param {string[]} groups - An array of strings representing user groups to include in the JWT.
 * @returns {string} A signed JWT string that includes the specified user groups in the payload.
 *
 * @example
 * const token = generateJwtWithGroups(['AdminUsers', 'RegularUsers']);
 * console.log(token); // Outputs a signed JWT string
 */
export const generateJwtWithGroups = (groups: string[]): string => {
  const payload = {
    'cognito:groups': groups,
  };

  return jwt.sign(payload, 'test-secret', {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
};
