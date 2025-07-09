import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

// Mock admin user for RBAC system management
const MOCK_ADMIN_USER = {
  user_id: 1,
  name: 'Database Administrator',
  username: 'admin',
  password: 'admin123',
  roles: ['admin', 'database_admin'],
  privileges: [
    'manage_users',
    'assign_roles',
    'manage_roles',
    'manage_privileges',
    'view_stats',
    'create_user',
    'drop_user',
    'grant_option',
    'select',
    'insert',
    'update',
    'delete'
  ]
};

// PhsarDesign3 database users with default password
const PHSAR_USERS = [
  {
    user_id: 5,
    name: 'PhsarDesign3 Admin',
    username: 'phsar_admin',
    password: 'temp123',
    roles: ['admin'],
    privileges: ['manage_users', 'assign_roles', 'create_project', 'view_applications', 'review_reports']
  },
  {
    user_id: 6,
    name: 'PhsarDesign3 Client',
    username: 'phsar_client',
    password: 'temp123',
    roles: ['client'],
    privileges: ['create_project', 'view_applications']
  },
  {
    user_id: 7,
    name: 'PhsarDesign3 Freelancer',
    username: 'phsar_freelancer',
    password: 'temp123',
    roles: ['freelancer'],
    privileges: ['apply_project']
  },
  {
    user_id: 8,
    name: 'PhsarDesign3 Moderator',
    username: 'phsar_moderator',
    password: 'temp123',
    roles: ['moderator'],
    privileges: ['review_reports', 'view_applications']
  }
];

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { success: false, error: 'Name and password are required' },
        { status: 400 }
      );
    }

    // Check RBAC admin user first
    if (name === MOCK_ADMIN_USER.username && password === MOCK_ADMIN_USER.password) {
      const authUser = {
        user_id: MOCK_ADMIN_USER.user_id,
        name: MOCK_ADMIN_USER.name,
        username: MOCK_ADMIN_USER.username,
        roles: MOCK_ADMIN_USER.roles,
        privileges: MOCK_ADMIN_USER.privileges,
      };

      return NextResponse.json({
        success: true,
        user: authUser,
        message: 'Login successful as RBAC Administrator'
      });
    }

    // Check PhsarDesign3 users
    const phsarUser = PHSAR_USERS.find(user => 
      user.username === name && user.password === password
    );

    if (phsarUser) {
      const authUser = {
        user_id: phsarUser.user_id,
        name: phsarUser.name,
        username: phsarUser.username,
        roles: phsarUser.roles,
        privileges: phsarUser.privileges,
      };

      return NextResponse.json({
        success: true,
        user: authUser,
        message: `Login successful as ${phsarUser.name}`
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
