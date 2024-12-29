// app/components/SessionInitializer.tsx
'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

export default function SessionInitializer() {
  useEffect(() => {
    let sessionId = Cookies.get('sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      Cookies.set('sessionId', sessionId, { expires: 7 }); // Expires in 7 days
      console.log('New sessionId created:', sessionId);
    } else {
      console.log('Existing sessionId found:', sessionId);
    }
  }, []);

  return null; // This component doesn't render anything visible
}
