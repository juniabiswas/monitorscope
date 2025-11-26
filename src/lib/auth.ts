import { NextRequest } from 'next/server';

export interface User {
  id: number;
  username: string;
  role: string;
}

export function getUserFromRequest(request: NextRequest): User | null {
  const auth = request.cookies.get('auth');
  if (!auth) {
    return null;
  }

  try {
    const decoded = Buffer.from(auth.value, 'base64').toString('utf-8');
    const [id, username, role] = decoded.split(':');
    return {
      id: parseInt(id),
      username,
      role
    };
  } catch (error) {
    return null;
  }
}

export function hasRole(user: User | null, allowedRoles: string[]): boolean {
  if (!user) {
    return false;
  }
  return allowedRoles.includes(user.role);
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, ['SuperAdmin', 'Admin']);
}

export function isSuperAdmin(user: User | null): boolean {
  return hasRole(user, ['SuperAdmin']);
}

export function canAccessEmailSettings(user: User | null): boolean {
  return hasRole(user, ['SuperAdmin', 'Admin']);
}

export function canAccessUserManagement(user: User | null): boolean {
  return hasRole(user, ['SuperAdmin', 'Admin']);
}
