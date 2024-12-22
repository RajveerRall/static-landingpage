// app/viewport.ts
import { NextRequest } from 'next/server'

export function generateViewport(request: NextRequest) {
  return {
    width: 'device-width',
    initialScale: 1,
  }
}

