import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import usersRouter from './routes/users';
import productsRouter from './routes/products';
import healthRouter from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import knex from 'knex';
import knexConfig from './knexFile';
import { Request, Response, NextFunction } from 'express-serve-static-core';

const app = express();
app.use(bodyParser.json());

let corsOrigin: string;

// It's problematic to set CORS options here *and* in the API Gateway. We can address that later.
if (process.env['NODE_ENV'] === 'local') {
  corsOrigin = 'http://localhost:4200';
} else {
  corsOrigin = '*';
}

const corsOptions = {
  origin: corsOrigin,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(logger);

// db will be test if running tests
if (!app.get('db')) {
  const db = knex(knexConfig[process.env['NODE_ENV'] || 'development']);
  app.set('db', db);
}

app.use(
  '/users',
  (req: Request, res: Response, next: NextFunction) => {
    req.db = app.get('db');
    next();
  },
  usersRouter
);

app.use(
  '/products',
  async (req: Request, res: Response, next: NextFunction) => {
    const db = app.get('db');
    req.db = db;
    next();
  },
  productsRouter
);

app.use('/health', healthRouter);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use(errorHandler);

export default app;
