import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { message: 'Missing required fields: fileName or fileType' },
        { status: 400 }
      );
    }

    const bucketName = process.env.S3_BUCKET_NAME!;
    const key = `videos/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ uploadURL, key }, { status: 200 });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { message: 'Error generating presigned URL' },
      { status: 500 }
    );
  }
}



// // // app/api/get-presigned-url/route.ts

// // import { NextRequest, NextResponse } from 'next/server'
// // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
// // import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// // // Initialize S3 Client
// // const s3 = new S3Client({
// //   region: process.env.AWS_REGION,
// //   credentials: {
// //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
// //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
// //   },
// // })

// // export async function POST(req: NextRequest) {
// //   try {
// //     const { fileName, fileType } = await req.json()

// //     // Validate request body
// //     if (!fileName || !fileType) {
// //       console.warn('Missing required fields: fileName or fileType')
// //       return NextResponse.json({ message: 'Missing required fields: fileName, fileType' }, { status: 400 })
// //     }

// //     const bucketName = process.env.S3_BUCKET_NAME

// //     // Check if S3_BUCKET_NAME is set
// //     if (!bucketName) {
// //       console.error('S3_BUCKET_NAME is not configured in environment variables.')
// //       return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 })
// //     }

// //     // Generate a unique key for the uploaded video
// //     const key = `videos/${Date.now()}_${fileName}`

// //     const command = new PutObjectCommand({
// //       Bucket: bucketName,
// //       Key: key,
// //       ContentType: fileType,
// //     })

// //     // Generate presigned URL
// //     const uploadURL = await getSignedUrl(s3, command, { expiresIn: 3600 }) // URL valid for 1 hour

// //     console.info(`Presigned URL generated successfully for key: ${key}`)
// //     return NextResponse.json({ uploadURL, key }, { status: 200 })
// //   } catch (error: any) {
// //     console.error('Error generating presigned URL:', error)
// //     return NextResponse.json({ message: 'Error generating presigned URL', error: error.message || 'Internal Server Error' }, { status: 500 })
// //   }
// // }


// // app/api/get-presigned-url/route.ts

// import { NextRequest, NextResponse } from 'next/server'
// import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
// import { loggerMiddleware } from '@aws-sdk/middleware-logger'

// // Prepare S3 config
// const s3Config: S3ClientConfig = {
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// }

// // Initialize S3 Client
// const s3 = new S3Client(s3Config)

// // Add logger middleware to S3 client (logs requests/responses)
// s3.middlewareStack.add(loggerMiddleware())

// export async function POST(req: NextRequest) {
//   try {
//     const { fileName, fileType } = await req.json()

//     // Validate request body
//     if (!fileName || !fileType) {
//       console.warn('Missing required fields: fileName or fileType')
//       return NextResponse.json({ message: 'Missing required fields: fileName, fileType' }, { status: 400 })
//     }

//     const bucketName = process.env.S3_BUCKET_NAME

//     // Check if S3_BUCKET_NAME is set
//     if (!bucketName) {
//       console.error('S3_BUCKET_NAME is not configured in environment variables.')
//       return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 })
//     }

//     // // Generate a unique key for the uploaded video
//     // const key = `videos/${Date.now()}_${fileName}`


//     // 1. Generate a single timestamp
//     const timestamp = Date.now()
//     // 2. Extract the raw filename (without extension) and keep the extension
//     const fileBase = fileName.replace(/\.[^/.]+$/, '')  // e.g. "create-gif-2"
//     const extension = fileName.split('.').pop()         // e.g. "mp4"

//     // 3. Build the final S3 key, e.g. "videos/1699999999999_create-gif-2.mp4"
//     const key = `videos/${timestamp}_${fileBase}.${extension}`

//     const command = new PutObjectCommand({
//       Bucket: bucketName,
//       Key: key,
//       ContentType: fileType,
//     })

//     // Generate presigned URL
//     const uploadURL = await getSignedUrl(s3, command, { expiresIn: 3600 }) // URL valid for 1 hour

//     console.info(`Presigned URL generated successfully for key: ${key}`)
//     return NextResponse.json({ uploadURL, key }, { status: 200 })
//   } catch (error: any) {
//     console.error('Error generating presigned URL:', error)
//     return NextResponse.json(
//       {
//         message: 'Error generating presigned URL',
//         error: error.message || 'Internal Server Error',
//       },
//       { status: 500 }
//     )
//   }
// }
