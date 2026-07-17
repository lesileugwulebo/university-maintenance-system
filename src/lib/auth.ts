import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { db } from './db';

const SECRET = process.env.JWT_SECRET || 'super-secret-miva-key-12345';
const COOKIE_NAME = 'miva_session';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function comparePassword(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (e) {
    return false;
  }
}

export function signJWT(payload: { userId: number; role: string }): string {
  // Build a standard JWT signature using Node crypto
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SECRET)
    .update(`${header}.${data}`)
    .digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyJWT(token: string): { userId: number; role: string } | null {
  try {
    const [header, data, signature] = token.split('.');
    if (!header || !data || !signature) return null;
    
    const expectedSignature = createHmac('sha256', SECRET)
      .update(`${header}.${data}`)
      .digest('base64url');
      
    const sig1 = Buffer.from(signature);
    const sig2 = Buffer.from(expectedSignature);
    
    if (sig1.length === sig2.length && timingSafeEqual(sig1, sig2)) {
      const payloadStr = Buffer.from(data, 'base64url').toString('utf8');
      return JSON.parse(payloadStr);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<any | null> {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((cookie) => {
        const [key, ...value] = cookie.trim().split('=');
        return [key, value.join('=')];
      })
    );

    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const decoded = verifyJWT(token);
    if (!decoded) return null;

    const user = db.prepare('SELECT u.*, r.name as roleName FROM User u JOIN Role r ON u.roleId = r.id WHERE u.id = ?').get(decoded.userId) as any;
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: {
        name: user.roleName,
      },
    };
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

export { COOKIE_NAME };
