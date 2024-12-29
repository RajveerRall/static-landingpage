// utils/ensureSessionId.ts
import Cookies from 'js-cookie'
import { v4 as uuidv4 } from 'uuid'

export function ensureSessionId() {
  let sessionId = Cookies.get('sessionId')
  if (!sessionId) {
    sessionId = uuidv4()
    Cookies.set('sessionId', sessionId, { expires: 7,   sameSite: 'none',
      secure: true,  domain: 'neverwrite.in',  }) // valid for 7 days
  }
  return sessionId
}
