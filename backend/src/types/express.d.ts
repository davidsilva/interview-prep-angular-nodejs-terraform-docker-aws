import { Knex } from 'knex';
import * as express from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    db: Knex;
  }
}

declare global {
  namespace Express {
    interface Request {
      userGroups?: string[]; // Cognito user groups, if using Cognito for auth
    }
  }
}
