import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { APIGatewayProxyHandler } from "aws-lambda";

const ssmClient = new SSMClient({ region: 'us-east-1' });

const getSSMParameter = async (name: string): Promise<string> => {
  if (!name) {
    throw new Error('SSM parameter name is required');
  }
    const command = new GetParameterCommand({ Name: name, WithDecryption: true });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || '';
};

export const handler: APIGatewayProxyHandler = async (event, context) => {
    const enableLogging = process.env.ENABLE_LOGGING === 'true';

    if (enableLogging) {
        console.log('Event', event);
        console.log('Context', context);
    }
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://dev.interviewprep.onyxdevtutorials.com';
    const paramName = "/interview-prep/development/API_KEY";

    const origin = event.headers?.origin || event.headers?.Origin;

    // The AWS API Gateway actually does the real CORS handling. This is meant to prevent access via non-browsers.
    if (!origin || origin !== allowedOrigin) {
        return {
            statusCode: 403,
            headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            body: JSON.stringify({message: 'Forbidden', error: 'Invalid origin'}),
        }
    }

    try {
        const apiKey = await getSSMParameter(paramName);
        // Possibly redundant CORS headers. Might be overwritten by the API Gateway.
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': allowedOrigin,
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            body: JSON.stringify({apiKey}),
        }
    } catch (err) {
        if (enableLogging) {
            console.error('Error getting API key', err);
        }

        if (err instanceof Error) {
            return {
                statusCode: 500,
                body: JSON.stringify({message: `Error getting API key: ${err}`, error: err.message}),
            }
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({message: 'Error getting API key', error: 'Unknown error'}),
            }
        }
    }
};