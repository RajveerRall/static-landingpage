// app/api/get-generated-markdown-url/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json()

    if (!fileName) {
      return NextResponse.json({ message: 'Missing required field: fileName' }, { status: 400 })
    }

    const bucketName = process.env.S3_BUCKET_NAME

    if (!bucketName) {
      console.error('S3_BUCKET_NAME is not configured in environment variables.')
      return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 })
    }

    const key = `documents/${fileName}.md`

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    try {
      const markdownURL = await getSignedUrl(s3, command, { expiresIn: 3600 }) // URL valid for 1 hour
      console.info(`Presigned Markdown URL generated successfully for key: ${key}`)
      return NextResponse.json({ markdownURL }, { status: 200 })
    } catch (error: any) {
      // If the file doesn't exist, S3 will throw an error
      console.warn(`Markdown file not found for key: ${key}`)
      return NextResponse.json({ message: 'Markdown not ready yet.' }, { status: 404 })
    }
  } catch (error: any) {
    console.error('Error generating presigned Markdown URL:', error)
    return NextResponse.json({ message: 'Error generating presigned Markdown URL', error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

