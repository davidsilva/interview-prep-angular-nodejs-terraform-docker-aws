jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn(() => ({
      verify: jest.fn((token: string) => {
        console.log('Mock CognitoJwtVerifier verify called with token:', token);
        if (token === 'valid-token-with-admin') {
          return Promise.resolve({
            'cognito:groups': ['AdminUsers'],
          });
        } else if (token === 'valid-token-without-groups') {
          return Promise.resolve({
            'cognito:groups': [],
          });
        } else {
          return Promise.reject(new Error('Invalid or expired token'));
        }
      }),
    })),
  },
}));

// Set dummy environment variables for tests
process.env['COGNITO_USER_POOL_ID'] = 'dummy-pool-id';
process.env['COGNITO_CLIENT_ID'] = 'dummy-client-id';
