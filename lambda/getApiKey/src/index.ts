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
    const paramName = "/interview-prep/dev/API_KEY";

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