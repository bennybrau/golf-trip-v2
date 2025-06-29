import { createRequestHandler } from '@react-router/node';

let build;

// Use dynamic import to handle ES modules properly
const getBuild = async () => {
  if (!build) {
    try {
      // Import the server build
      build = await import('../../build/server/index.js');
    } catch (error) {
      console.error('Failed to import server build:', error);
      throw error;
    }
  }
  return build;
};

export const handler = async (event) => {
  try {
    const serverBuild = await getBuild();
    
    // Create the request handler
    const handleRequest = createRequestHandler({
      build: serverBuild,
      mode: process.env.NODE_ENV || 'production',
    });

    // Convert Netlify event to standard Request
    const url = new URL(event.path, `https://${event.headers.host}`);
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const request = new Request(url.toString(), {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body) : undefined,
    });

    // Handle the request
    const response = await handleRequest(request);

    // Convert Response to Netlify format
    const body = await response.text();
    
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};