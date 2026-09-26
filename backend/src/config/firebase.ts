import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let initError: string | null = null;

function initFirebase() {
  if (admin.apps.length > 0) return;

  let serviceAccount: any;
  const rawPaths: (string | undefined)[] = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.join(__dirname, 'service-account.json'),
    path.resolve(__dirname, '../../src/config/service-account.json'),
    path.join(process.cwd(), 'src/config/service-account.json'),
    path.join(process.cwd(), 'backend/src/config/service-account.json'),
    path.join(process.cwd(), 'backend/dist/config/service-account.json'),
  ];
  const candidatePaths = rawPaths.filter((p): p is string => typeof p === 'string' && fs.existsSync(p));

  // 1. Try FIREBASE_SERVICE_ACCOUNT environment variable (JSON string or Base64)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    // Strip accidental wrapping quotes from .env / Vercel dashboard
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      // Try decoding base64 if direct JSON parsing failed
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } catch (e: any) {
        initError = `Failed to parse FIREBASE_SERVICE_ACCOUNT: ${e.message}`;
        console.error(initError);
      }
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } catch (e: any) {
      initError = `Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64: ${e.message}`;
      console.error(initError);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // 2. Try individual environment variables
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID || 'luxefashion-9f050',
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
    };
  } else if (candidatePaths.length > 0) {
    // 3. Try reading from candidate file paths on disk
    try {
      serviceAccount = JSON.parse(fs.readFileSync(candidatePaths[0], 'utf8'));
    } catch (e: any) {
      initError = `Failed reading service-account file at ${candidatePaths[0]}: ${e.message}`;
      console.error(initError);
    }
  }

  // Handle double-stringified JSON if present
  if (typeof serviceAccount === 'string') {
    try {
      serviceAccount = JSON.parse(serviceAccount);
    } catch {}
  }

  if (serviceAccount && typeof serviceAccount === 'object') {
    // Crucial: Fix escaped newlines in the private key (\n -> actual newline character)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'luxefashion-9f050',
      });
      initError = null;
    } catch (e: any) {
      initError = `Failed to initialize Firebase Admin: ${e.message}`;
      console.error(initError);
    }
  } else {
    initError = initError || 'Firebase service account not found. Please set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL.';
    console.warn(initError);
  }
}

initFirebase();

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    initFirebase();
    if (admin.apps.length === 0) {
      throw new Error(initError || 'Firebase is not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
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
      throw new Error(initError || 'Firebase is not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    const firebaseAuth = admin.auth();
    const val = (firebaseAuth as any)[prop];
    return typeof val === 'function' ? val.bind(firebaseAuth) : val;
  }
});

export default admin;
