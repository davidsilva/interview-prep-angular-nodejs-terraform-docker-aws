import knex from 'knex';
import knexConfig from './knexFile.js';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: 'us-east-1' });

const getSSMParameter = async (name: string): Promise<string> => {
  if (!name) {
    throw new Error('SSM parameter name is required');
  }
    const command = new GetParameterCommand({ Name: name, WithDecryption: true });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || '';
};

export const runMigrations = async () => {
    try {
        const env = process.env.NODE_ENV || 'development';
        const config = knexConfig[env];
    
        config.connection = {
            host: await getSSMParameter(process.env.DB_HOST_PARAM || ''),
            user: await getSSMParameter(process.env.DB_USER_PARAM || ''),
            password: await getSSMParameter(process.env.DB_PASS_PARAM || ''),
            database: await getSSMParameter(process.env.DB_NAME_PARAM || ''),
            port: parseInt(await getSSMParameter(process.env.DB_PORT_PARAM || ''), 10),
            ssl: { rejectUnauthorized: false },
        };

        console.log('Config:', config.connection);

        const db = knex(config);

        console.log('Running migrations...');

        await db.migrate.latest()
            .then(() => {
                console.log('Migrations ran successfully');
            })
            .catch((err) => {
                console.error('Error running migrations:', err);
                throw err;
            });
    } catch (err) {
        console.error('Error running migrations:', err);
        throw err;
    }
};

