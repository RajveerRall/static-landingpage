// app/api/use-feature/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'cookie';

// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    // 1. Extract sessionId from Cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    let sessionId = cookies.sessionId;

    // 2. If sessionId is missing, generate one and set it in response cookies
    if (!sessionId) {
      sessionId = uuidv4();
      // Note: Setting cookies in NextResponse requires using Set-Cookie header
      const response = NextResponse.json({ message: 'New session initialized.' });
      response.cookies.set('sessionId', sessionId, { path: '/', maxAge: 7 * 24 * 60 * 60 }); // 7 days
      return response;
    }

    // 3. Check usage in DynamoDB
    const tableName = process.env.DYNAMO_TABLE || 'DocUsage';
    const getCmd = new GetItemCommand({
      TableName: tableName,
      Key: { sessionId: { S: sessionId } },
    });
    const getRes = await dynamo.send(getCmd);

    let currentCount = 0;
    if (getRes.Item && getRes.Item.count) {
      currentCount = parseInt(getRes.Item.count.N || '0', 10);
    }

    // 4. If usage >= 2, block and require sign-up
    if (currentCount >= 2) {
      return NextResponse.json(
        { message: 'Usage limit reached. Please sign up to continue.' },
        { status: 403 }
      );
    }

    // 5. Increment usage count
    currentCount += 1;
    const putCmd = new PutItemCommand({
      TableName: tableName,
      Item: {
        sessionId: { S: sessionId },
        count: { N: currentCount.toString() },
        // Optionally, store IP address
        // ipAddress: { S: req.ip || 'unknown' },
      },
    });
    await dynamo.send(putCmd);

    // 6. Log usage for analytics (optional)
    // You can integrate with Google Analytics here if needed

    // 7. Proceed with your existing doc-generation logic
    // For example, return a success message or trigger another API call
    return NextResponse.json(
      { message: `Feature used successfully. Attempt #${currentCount}` },
      { status: 200 }
    );

  } catch (err: any) {
    console.error('Error in use-feature route:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}



// import { NextRequest, NextResponse } from 'next/server'
// import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
// import { unmarshall } from '@aws-sdk/util-dynamodb'

// // Initialize your DynamoDB client
// const dynamoClient = new DynamoDBClient({
//   region: 'ap-south-1', // or your region
// })

// const USAGE_LIMIT = 2 // or any limit you want

// export async function POST(req: NextRequest) {
//   try {
//     // 1) Extract the session ID from cookie
//     const cookieHeader = req.headers.get('cookie') ?? ''
//     let sessionId: string | undefined
//     cookieHeader.split(';').forEach((pair) => {
//       const [k, v] = pair.trim().split('=')
//       if (k === 'sessionId') {
//         sessionId = v
//       }
//     })

//     // If no cookie found
//     if (!sessionId) {
//       return NextResponse.json({ message: 'Missing session ID' }, { status: 400 })
//     }

//     // 2) Check existing usage from DynamoDB
//     // We'll do a get before we do an update, or we can do an atomic update.
//     // For clarity, let's do a simple "read first" approach:

//     const getItemCmd = new GetItemCommand({
//       TableName: 'DocUsage', // your table name
//       Key: {
//         sessionId: { S: sessionId },
//       },
//     })

//     const getItemResp = await dynamoClient.send(getItemCmd)
//     let usageCount = 0

//     if (getItemResp.Item) {
//       const itemData = unmarshall(getItemResp.Item)
//       usageCount = itemData.usageCount ?? 0
//     }

//     // 3) If usage >= limit, block
//     if (usageCount >= USAGE_LIMIT) {
//       return NextResponse.json({ message: 'Usage limit exceeded' }, { status: 403 })
//     }

//     // 4) Otherwise, increment usage
//     //    Using an UpdateItem so it’s atomic in one call.

//     const updateItemCmd = new UpdateItemCommand({
//       TableName: 'DocUsage',
//       Key: {
//         sessionId: { S: sessionId },
//       },
//       UpdateExpression: 'ADD usageCount :inc SET lastUsed = :ts',
//       ExpressionAttributeValues: {
//         ':inc': { N: '1' },
//         ':ts': { N: String(Date.now()) },
//       },
//       ReturnValues: 'ALL_NEW',
//     })

//     const updateResp = await dynamoClient.send(updateItemCmd)

//     // Optional: parse updated usage
//     const updatedItem = unmarshall(updateResp.Attributes ?? {})
//     const newCount = updatedItem.usageCount

//     // 5) Return success if usage incremented
//     return NextResponse.json({
//       message: 'Usage OK',
//       usage: newCount,
//     })
//   } catch (error) {
//     console.error('Error in /api/use-feature:', error)
//     return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
//   }
// }



// // // app/api/use-feature/route.ts (if using Next.js App Router)
// // import { NextRequest, NextResponse } from 'next/server'
// // import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
// // import { v4 as uuidv4 } from 'uuid'

// // // Create DynamoDB client 
// // const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION })

// // export async function POST(req: NextRequest) {
// //   try {


// //     // 1. Extract sessionId from Cookie or request body
// //     const cookieHeader = req.headers.get('cookie') || ''
// //     const cookies = Object.fromEntries(
// //       cookieHeader.split(';').map((c) => {
// //         const [k, v] = c.trim().split('=')
// //         return [k, v]
// //       })
// //     )
// //     const sessionId = cookies.sessionId // or fallback to something else
// //     if (!sessionId) {
// //       return NextResponse.json({ message: 'Missing session ID' }, { status: 400 })
// //     }

// //     // 2. Check usage in DynamoDB
// //     const tableName = process.env.DYNAMO_TABLE || 'DocUsage'
// //     const getCmd = new GetItemCommand({
// //       TableName: tableName,
// //       Key: { sessionId: { S: sessionId } },
// //     })
// //     const getRes = await dynamo.send(getCmd)
    
// //     let currentCount = 0
// //     if (getRes.Item && getRes.Item.count) {
// //       currentCount = parseInt(getRes.Item.count.N || '0', 10)
// //     }

// //     // 3. If usage > 2 => block
// //     if (currentCount >= 2) {
// //       return NextResponse.json({ message: 'Usage limit reached. Please sign up.' }, { status: 403 })
// //     }

// //     // 4. Increment usage
// //     currentCount++
// //     const putCmd = new PutItemCommand({
// //       TableName: tableName,
// //       Item: {
// //         sessionId: { S: sessionId },
// //         count: { N: currentCount.toString() },
// //         // optionally store IP, timestamps, etc.
// //       },
// //     })
// //     await dynamo.send(putCmd)

// //     // 5. DO your doc-generation or presigned-URL logic here
// //     //    e.g. returning the same result you do now
// //     //    for demonstration, we just return success:
// //     return NextResponse.json({
// //       message: 'You used the feature. This is attempt #' + currentCount,
// //     })
    
// //   } catch (err: any) {
// //     console.error('Error in use-feature route:', err)
// //     return NextResponse.json({ message: 'Server error' }, { status: 500 })
// //   }
// // }
