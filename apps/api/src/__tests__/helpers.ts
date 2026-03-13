import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || 'test-secret-for-integration-tests-minimum-32-chars';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export const testUser: MockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user'],
};

export const testAdmin: MockUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  roles: ['admin'],
};

/**
 * Generate a valid JWT token for a test user.
 */
export function generateToken(user: MockUser = testUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, roles: user.roles },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

/**
 * Generate an expired JWT token.
 */
export function generateExpiredToken(user: MockUser = testUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, roles: user.roles },
    JWT_SECRET,
    { expiresIn: '-1h' },
  );
}
