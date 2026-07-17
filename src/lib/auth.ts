import { db } from './db';
import { verifyJWT, signJWT, hashPassword, comparePassword } from './crypto';

const COOKIE_NAME = 'miva_session';

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

    const user = await db.get(
      'SELECT u.*, r.name as roleName FROM User u JOIN Role r ON u.roleId = r.id WHERE u.id = ?',
      [decoded.userId]
    );
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

export { COOKIE_NAME, verifyJWT, signJWT, hashPassword, comparePassword };
