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
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://dev.interviewprep.onyxdevtutorials.com';
    const paramName = "/interview-prep/dev/API_KEY";

    const origin = event.headers.origin || event.headers.Origin;

    if (origin !== allowedOrigin) {
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
        return {
            statusCode: 200,
            body: JSON.stringify({apiKey}),
        }
    } catch (err) {
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