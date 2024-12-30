import { APIGatewayEvent, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

exports.handler = async (event: APIGatewayEvent, context: Context) => {
  try {
    // Parse request body
    const { fileName }: { fileName?: string } = JSON.parse(event.body || '{}');

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required field: fileName' }),
      };
    }

    const bucketName = process.env.S3_BUCKET_NAME!;
    const key = `documents/${fileName}.md`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      const markdownURL = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return {
        statusCode: 200,
        body: JSON.stringify({ markdownURL }),
      };
    } catch (s3Error) {
      console.error('Error generating signed URL:', s3Error);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Markdown not ready yet or file does not exist.' }),
      };
    }
  } catch (error) {
    console.error('Error in get-generated-markdown-url function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};






// 
// import { NextRequest, NextResponse } from 'next/server';
// import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// export async function POST(req: NextRequest) {
//   try {
//     const { fileName } = await req.json();

//     if (!fileName) {
//       console.error('Missing required field: fileName');
//       return NextResponse.json({ message: 'fileName is required' }, { status: 400 });
//     }

//     const bucketName = process.env.S3_BUCKET_NAME;
//     if (!bucketName) {
//       console.error('Bucket name is not configured.');
//       return NextResponse.json({ message: 'Bucket not configured' }, { status: 500 });
//     }

//     const key = `documents/${fileName}.md`;

//     try {
//       const command = new GetObjectCommand({
//         Bucket: bucketName,
//         Key: key,
//       });
//       console.info('Attempting to fetch:', { bucket: bucketName, key });
//       const markdownURL = await getSignedUrl(s3, command, { expiresIn: 3600 });
//       console.info('Generated URL:', markdownURL);
//       return NextResponse.json({ markdownURL }, { status: 200 });
//     } catch (s3Error: any) {
//       console.error(`Error fetching file from S3: ${s3Error.message}`);
//       return NextResponse.json({ message: 'File not found or inaccessible' }, { status: 404 });
//     }
//   } catch (error: any) {
//     console.error('Unexpected server error:', error);
//     return NextResponse.json(
//       { message: 'Unexpected server error', error: error.message },
//       { status: 500 }
//     );
//   }
// }
