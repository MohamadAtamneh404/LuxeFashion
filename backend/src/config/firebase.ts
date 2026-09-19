import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.join(__dirname, 'service-account.json');

function initFirebase() {
  if (admin.apps.length > 0) return;

  let serviceAccount: any;
  const rawPaths: (string | undefined)[] = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.join(__dirname, 'service-account.json'),
    path.resolve(__dirname, '../../src/config/service-account.json'),
    path.join(process.cwd(), 'src/config/service-account.json'),
    path.join(process.cwd(), 'backend/src/config/service-account.json'),
  ];
  const candidatePaths = rawPaths.filter((p): p is string => typeof p === 'string' && fs.existsSync(p));

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e);
    }
  } else if (candidatePaths.length > 0) {
    serviceAccount = JSON.parse(fs.readFileSync(candidatePaths[0], 'utf8'));
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

