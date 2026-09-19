import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.join(__dirname, 'service-account.json');

function initFirebase() {
  if (admin.apps.length > 0) return;

  let serviceAccount: any;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  } else {
    console.warn(
      'Firebase service account not found. Provide service-account.json in src/config or set FIREBASE_SERVICE_ACCOUNT env var.'
    );
  }
}

initFirebase();

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    initFirebase();
    if (admin.apps.length === 0) {
      throw new Error('Firebase is not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    const firestore = admin.firestore();
    const val = (firestore as any)[prop];
    return typeof val === 'function' ? val.bind(firestore) : val;
  }
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    initFirebase();
    if (admin.apps.length === 0) {
      throw new Error('Firebase is not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    const firebaseAuth = admin.auth();
    const val = (firebaseAuth as any)[prop];
    return typeof val === 'function' ? val.bind(firebaseAuth) : val;
  }
});

export default admin;

