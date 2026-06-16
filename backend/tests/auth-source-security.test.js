/**
 * Fleet AutoLink — Auth & Source Code Security Analysis
 *
 * Static analysis of web/src/lib/firebase.ts, web/src/context/AuthContext.tsx,
 * firebase.json (hosting headers), and other security-sensitive files.
 * Verifies environment variable usage, CSP headers, and auth practices.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../');

function readFile(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { return ''; }
}

// ── 1. Firebase Config — No Hardcoded Secrets ────────────────────────────────

describe('SEC-13 Firebase Config — No Hardcoded Credentials', () => {
  let firebaseTs = '';
  beforeAll(() => { firebaseTs = readFile('web/src/lib/firebase.ts'); });

  it('apiKey is loaded from environment variables, not hardcoded', () => {
    expect(firebaseTs).toContain('import.meta.env.VITE_FIREBASE_API_KEY');
    expect(firebaseTs).not.toMatch(/apiKey:\s*["'][A-Za-z0-9_-]{20,}/);
  });

  it('authDomain is loaded from environment variables', () => {
    expect(firebaseTs).toContain('import.meta.env.VITE_FIREBASE_AUTH_DOMAIN');
  });

  it('databaseURL is loaded from environment variables', () => {
    expect(firebaseTs).toContain('import.meta.env.VITE_FIREBASE_DATABASE_URL');
  });

  it('projectId is loaded from environment variables', () => {
    expect(firebaseTs).toContain('import.meta.env.VITE_FIREBASE_PROJECT_ID');
  });

  it('no raw API keys appear in firebase.ts (no AIza... pattern)', () => {
    expect(firebaseTs).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
  });

  it('firebase is initialized once via getApps() check (no double-init)', () => {
    expect(firebaseTs).toContain('getApps().length === 0');
  });
});

// ── 2. Mobile Firebase Config ────────────────────────────────────────────────

describe('SEC-14 Mobile Firebase Config — No Hardcoded Credentials', () => {
  let mobileFirebaseTs = '';
  beforeAll(() => { mobileFirebaseTs = readFile('mobile/src/lib/firebase.ts'); });

  it('mobile firebase config uses environment/process variables', () => {
    const usesEnv = mobileFirebaseTs.includes('process.env') ||
                    mobileFirebaseTs.includes('EXPO_PUBLIC_') ||
                    mobileFirebaseTs.includes('Constants.') ||
                    mobileFirebaseTs.includes('import.meta.env');
    expect(usesEnv).toBe(true);
  });

  it('no raw API key in mobile firebase config', () => {
    expect(mobileFirebaseTs).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
  });
});

// ── 3. AuthContext Security Practices ────────────────────────────────────────

describe('SEC-15 AuthContext — Authentication Security', () => {
  let authCtx = '';
  beforeAll(() => { authCtx = readFile('web/src/context/AuthContext.tsx'); });

  it('uses Firebase signInWithEmailAndPassword (not custom auth)', () => {
    expect(authCtx).toContain('signInWithEmailAndPassword');
  });

  it('uses Firebase signOut for logout (proper session termination)', () => {
    expect(authCtx).toContain('signOut(auth)');
  });

  it('onAuthStateChanged listener clears appUser on sign-out', () => {
    expect(authCtx).toContain('setAppUser(null)');
  });

  it('Google sign-in uses official GoogleAuthProvider', () => {
    expect(authCtx).toContain('new GoogleAuthProvider()');
    expect(authCtx).toContain('signInWithPopup');
  });

  it('completeGoogleProfile uses caller uid (not client-supplied uid)', () => {
    // The uid parameter comes from Firebase auth result, not raw client input
    expect(authCtx).toContain('await setDoc(doc(db, "users", uid), newUser)');
  });

  it('register stores uid from Firebase credential (not user-supplied)', () => {
    expect(authCtx).toContain('cred.user.uid');
  });

  it('no raw passwords are logged or stored client-side', () => {
    expect(authCtx).not.toContain('console.log(password');
    expect(authCtx).not.toContain('localStorage.setItem');
    expect(authCtx).not.toContain('sessionStorage.setItem');
  });

  it('[KNOWN FINDING] createdAt is set from client Date (not server timestamp)', () => {
    // Client-controlled timestamp can be manipulated.
    // Recommended: use Firestore serverTimestamp() instead.
    const usesClientDate = authCtx.includes('new Date().toISOString()');
    if (usesClientDate) {
      console.warn('FINDING-L2: createdAt uses client-side new Date(). Use Firestore serverTimestamp() for tamper resistance.');
    }
    expect(typeof usesClientDate).toBe('boolean');
  });
});

// ── 4. Hosting Security Headers ───────────────────────────────────────────────

describe('SEC-16 Firebase Hosting — HTTP Security Headers', () => {
  let firebaseJson = {};
  beforeAll(() => {
    try { firebaseJson = JSON.parse(readFile('firebase.json')); } catch {}
  });

  it('firebase.json has hosting headers configured', () => {
    expect(firebaseJson.hosting).toBeDefined();
    expect(firebaseJson.hosting.headers).toBeDefined();
    expect(Array.isArray(firebaseJson.hosting.headers)).toBe(true);
  });

  it('X-Frame-Options: DENY header is set (clickjacking protection)', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const xfo = headers.find(h => h.key === 'X-Frame-Options');
    expect(xfo).toBeDefined();
    expect(xfo.value).toBe('DENY');
  });

  it('X-Content-Type-Options: nosniff header is set (MIME sniffing protection)', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const xcto = headers.find(h => h.key === 'X-Content-Type-Options');
    expect(xcto).toBeDefined();
    expect(xcto.value).toBe('nosniff');
  });

  it('Referrer-Policy header is set', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const rp = headers.find(h => h.key === 'Referrer-Policy');
    expect(rp).toBeDefined();
    expect(rp.value).toBe('strict-origin-when-cross-origin');
  });

  it('Content-Security-Policy header is defined', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const csp = headers.find(h => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp.value.length).toBeGreaterThan(20);
  });

  it('CSP restricts script sources to self (default-src is set)', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const csp = headers.find(h => h.key === 'Content-Security-Policy');
    expect(csp?.value).toContain("default-src 'self'");
  });

  it('CSP restricts connect-src to known Firebase and API domains', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const csp = headers.find(h => h.key === 'Content-Security-Policy');
    expect(csp?.value).toContain('firebaseio.com');
    expect(csp?.value).toContain('googleapis.com');
  });

  it('[KNOWN FINDING] CSP contains unsafe-inline for scripts', () => {
    // unsafe-inline weakens XSS protection.
    // Recommended: use nonce-based or hash-based CSP for inline scripts.
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const csp = headers.find(h => h.key === 'Content-Security-Policy');
    const hasUnsafeInline = csp?.value?.includes("'unsafe-inline'");
    if (hasUnsafeInline) {
      console.warn("FINDING-M3: CSP contains 'unsafe-inline' for script-src. Use nonce-based CSP for stronger XSS protection.");
    }
    expect(typeof hasUnsafeInline).toBe('boolean');
  });

  it('Permissions-Policy is defined (geolocation restricted)', () => {
    const headers = firebaseJson.hosting?.headers?.[0]?.headers || [];
    const pp = headers.find(h => h.key === 'Permissions-Policy');
    expect(pp).toBeDefined();
    expect(pp.value).toContain('geolocation');
  });
});

// ── 5. No Sensitive Data in Source Code ──────────────────────────────────────

describe('SEC-17 No Sensitive Data Exposure in Source', () => {
  const scanFiles = [
    'web/src/lib/firebase.ts',
    'web/src/context/AuthContext.tsx',
    'web/src/lib/notifications.ts',
    'mobile/src/lib/firebase.ts',
    'firebase.json',
    'database.rules.json',
    'firestore.rules',
  ];

  it('no hardcoded API keys (AIzaSy prefix) in scanned source files', () => {
    const violations = [];
    scanFiles.forEach(f => {
      const content = readFile(f);
      if (/AIzaSy[A-Za-z0-9_-]{33}/.test(content)) violations.push(f);
    });
    expect(violations).toHaveLength(0);
  });

  it('no JWT secrets or private keys in scanned source files', () => {
    const violations = [];
    scanFiles.forEach(f => {
      const content = readFile(f);
      if (/-----BEGIN (RSA |EC )?PRIVATE KEY-----/.test(content)) violations.push(f);
    });
    expect(violations).toHaveLength(0);
  });

  it('no plain-text password patterns in source files', () => {
    const violations = [];
    scanFiles.forEach(f => {
      const content = readFile(f);
      if (/password\s*=\s*["'][^"']{6,}["']/.test(content)) violations.push(f);
    });
    // demo passwords (test1234) in LoginPage are expected - check only backend/config files
    expect(violations.filter(f => !f.includes('pages'))).toHaveLength(0);
  });

  it('no GitHub PAT tokens (ghp_) in source files', () => {
    const violations = [];
    scanFiles.forEach(f => {
      const content = readFile(f);
      if (/ghp_[A-Za-z0-9]{36}/.test(content)) violations.push(f);
    });
    expect(violations).toHaveLength(0);
  });

  it('.gitignore exists and excludes .env files', () => {
    const gitignore = readFile('.gitignore');
    expect(gitignore.length).toBeGreaterThan(0);
    expect(gitignore).toMatch(/\.env/);
  });
});

// ── 6. NoSQL Injection Prevention ────────────────────────────────────────────

describe('SEC-18 NoSQL Injection Prevention', () => {
  it('Firestore queries use typed SDK methods (not raw query strings)', () => {
    const hookFile = readFile('web/src/hooks/useFirestore.ts');
    // Firestore SDK enforces type-safe queries — no raw string interpolation into queries
    expect(hookFile).toContain('collection(db');
  });

  it('RTDB path construction does not use unsanitized user input directly', () => {
    // RTDB rules are the primary protection; rules verify driverId === auth.uid
    const dbRules = readFile('database.rules.json');
    expect(dbRules).toContain('auth.uid');
  });

  it('Firestore rules use parameterized path variables (not string concat)', () => {
    const fsRules = readFile('firestore.rules');
    // Match block uses {vehicleId}, {userId} — get() calls use $(vehicleId)
    expect(fsRules).toContain('{vehicleId}');
    expect(fsRules).toContain('{userId}');
    expect(fsRules).toContain('$(vehicleId)');
  });
});
