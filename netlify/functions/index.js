export const handler = async (event) => {
  try {
    // Import the server build dynamically
    const serverBuild = await import('../../build/server/index.js');
    
    // Convert Netlify event to standard Request
    const url = new URL(event.path || '/', `https://${event.headers.host || 'localhost'}`);
    
    // Add query parameters
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    // Create headers object
    const headers = new Headers();
    if (event.headers) {
      Object.entries(event.headers).forEach(([key, value]) => {
        if (value) headers.set(key, value);
      });
    }

    // Handle body
    let body = undefined;
    if (event.body) {
      body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    }

    const request = new Request(url.toString(), {
      method: event.httpMethod || 'GET',
      headers,
      body: body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? body : undefined,
    });

    // Call the server build's default export (which should be the fetch handler)
    const response = await serverBuild.default(request);

    // Convert Response to Netlify format
    const responseBody = await response.text();
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('Handler error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};