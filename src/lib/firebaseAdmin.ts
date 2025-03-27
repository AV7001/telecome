import admin from 'firebase-admin';
import serviceAccount from '../../telecom-8ca2b-0cdeef46b740.json';

let messaging: admin.messaging.Messaging;

if (typeof window === 'undefined') {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  messaging = admin.messaging();
}

export { messaging };