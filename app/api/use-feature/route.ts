// app/api/use-feature/route.ts (if using Next.js App Router)
import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { v4 as uuidv4 } from 'uuid'

// Create DynamoDB client 
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION })

export async function POST(req: NextRequest) {
  try {


    // 1. Extract sessionId from Cookie or request body
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, v] = c.trim().split('=')
        return [k, v]
      })
    )
    const sessionId = cookies.sessionId // or fallback to something else
    if (!sessionId) {
      return NextResponse.json({ message: 'Missing session ID' }, { status: 400 })
    }

    // 2. Check usage in DynamoDB
    const tableName = process.env.DYNAMO_TABLE || 'DocUsage'
    const getCmd = new GetItemCommand({
      TableName: tableName,
      Key: { sessionId: { S: sessionId } },
    })
    const getRes = await dynamo.send(getCmd)
    
    let currentCount = 0
    if (getRes.Item && getRes.Item.count) {
      currentCount = parseInt(getRes.Item.count.N || '0', 10)
    }

    // 3. If usage > 2 => block
    if (currentCount >= 2) {
      return NextResponse.json({ message: 'Usage limit reached. Please sign up.' }, { status: 403 })
    }

    // 4. Increment usage
    currentCount++
    const putCmd = new PutItemCommand({
      TableName: tableName,
      Item: {
        sessionId: { S: sessionId },
        count: { N: currentCount.toString() },
        // optionally store IP, timestamps, etc.
      },
    })
    await dynamo.send(putCmd)

    // 5. DO your doc-generation or presigned-URL logic here
    //    e.g. returning the same result you do now
    //    for demonstration, we just return success:
    return NextResponse.json({
      message: 'You used the feature. This is attempt #' + currentCount,
    })
    
  } catch (err: any) {
    console.error('Error in use-feature route:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
