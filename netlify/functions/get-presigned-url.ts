import { APIGatewayEvent, Context } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
dotenv.config();


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Define the handler function
exports.handler = async (event: APIGatewayEvent, context: Context) => {
  try {
    // Ensure the method is POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { Allow: 'POST' },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Parse the request body
    const { fileName, fileType }: { fileName?: string; fileType?: string } = JSON.parse(event.body || '{}');

    // Validate request body fields
    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: fileName or fileType',
        }),
      };
    }

    // Generate the S3 key
    const bucketName = process.env.S3_BUCKET_NAME!;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_'); // Sanitize file name
    const key = `videos/${Date.now()}_${sanitizedFileName}`;

    // Create the S3 command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    // Generate a presigned URL
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Return the presigned URL and key
    return {
      statusCode: 200,
      body: JSON.stringify({ uploadURL, key }),
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust based on allowed domains
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      },
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);

    // Handle server errors
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
