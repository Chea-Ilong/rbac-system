import { pool } from './database-config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Type definitions
export interface User {
  user_id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
}

export interface Role {
  role_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Privilege {
  privilege_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface UserRole {
  user_id: number;
  role_id: number;
  assigned_at: string;
}

export interface RolePrivilege {
  role_id: number;
  privilege_id: number;
  assigned_at: string;
}

// Real-time database implementation
export const db = {
  // Initialize database (ensure tables exist)
  async init(): Promise<void> {
    try {
      // Test connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  },

  // User operations
  async getUsers(): Promise<User[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users ORDER BY created_at DESC');
      return rows as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUserById(id: number): Promise<User | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE user_id = ?', [id]);
      return rows.length > 0 ? rows[0] as User : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Users WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0] as User : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  },

  async createUser(userData: { name: string; email: string; password: string }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error(`User with email ${userData.email} already exists`);
      }

      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
        [userData.name, userData.email, userData.password]
      );

      const newUser = await this.getUserById(result.insertId);
      if (!newUser) {
        throw new Error('Failed to retrieve created user');
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: number, userData: Partial<{ name: string; email: string; password: string }>): Promise<User | null> {
    try {
      const fields = [];
      const values = [];

      if (userData.name !== undefined) {
        fields.push('name = ?');
        values.push(userData.name);
      }
      if (userData.email !== undefined) {
        fields.push('email = ?');
        values.push(userData.email);
      }
      if (userData.password !== undefined) {
        fields.push('password = ?');
        values.push(userData.password);
      }

      if (fields.length === 0) {
        return this.getUserById(id);
      }

      values.push(id);
      await pool.execute(
        `UPDATE Users SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );

      return this.getUserById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM Users WHERE user_id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Role operations
  async getRoles(): Promise<Role[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Roles ORDER BY created_at DESC');
      return rows as Role[];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getRoleById(id: number): Promise<Role | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Roles WHERE role_id = ?', [id]);
      return rows.length > 0 ? rows[0] as Role : null;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  },

  async createRole(roleData: { name: string; description?: string }): Promise<Role> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO Roles (name, description) VALUES (?, ?)',
        [roleData.name, roleData.description || '']
      );

      const newRole = await this.getRoleById(result.insertId);
      if (!newRole) {
        throw new Error('Failed to retrieve created role');
      }

      return newRole;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  async updateRole(id: number, roleData: Partial<{ name: string; description: string }>): Promise<Role | null> {
    try {
      const fields = [];
      const values = [];

      if (roleData.name !== undefined) {
        fields.push('name = ?');
        values.push(roleData.name);
      }
      if (roleData.description !== undefined) {
        fields.push('description = ?');
        values.push(roleData.description);
      }

      if (fields.length === 0) {
        return this.getRoleById(id);
      }

      values.push(id);
      await pool.execute(
        `UPDATE Roles SET ${fields.join(', ')} WHERE role_id = ?`,
        values
      );

      return this.getRoleById(id);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  async deleteRole(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM Roles WHERE role_id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  // Privilege operations
  async getPrivileges(): Promise<Privilege[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Privileges ORDER BY created_at DESC');
      return rows as Privilege[];
    } catch (error) {
      console.error('Error fetching privileges:', error);
      throw error;
    }
  },

  async getPrivilegeById(id: number): Promise<Privilege | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Privileges WHERE privilege_id = ?', [id]);
      return rows.length > 0 ? rows[0] as Privilege : null;
    } catch (error) {
      console.error('Error fetching privilege:', error);
      throw error;
    }
  },

  async createPrivilege(privilegeData: { name: string; description?: string }): Promise<Privilege> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO Privileges (name, description) VALUES (?, ?)',
        [privilegeData.name, privilegeData.description || '']
      );

      const newPrivilege = await this.getPrivilegeById(result.insertId);
      if (!newPrivilege) {
        throw new Error('Failed to retrieve created privilege');
      }

      return newPrivilege;
    } catch (error) {
      console.error('Error creating privilege:', error);
      throw error;
    }
  },

  // User Role operations
  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT r.* FROM Roles r 
         INNER JOIN UserRoles ur ON r.role_id = ur.role_id 
         WHERE ur.user_id = ?`,
        [userId]
      );
      return rows as Role[];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  },

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    try {
      await pool.execute(
        'INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
        [userId, roleId]
      );
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  },

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM UserRoles WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  },

  // Role Privilege operations
  async getRolePrivileges(roleId: number): Promise<Privilege[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT p.* FROM Privileges p 
         INNER JOIN RolePrivileges rp ON p.privilege_id = rp.privilege_id 
         WHERE rp.role_id = ?`,
        [roleId]
      );
      return rows as Privilege[];
    } catch (error) {
      console.error('Error fetching role privileges:', error);
      throw error;
    }
  },

  async assignPrivilegeToRole(roleId: number, privilegeId: number): Promise<void> {
    try {
      await pool.execute(
        'INSERT INTO RolePrivileges (role_id, privilege_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
        [roleId, privilegeId]
      );
    } catch (error) {
      console.error('Error assigning privilege to role:', error);
      throw error;
    }
  },

  async removePrivilegeFromRole(roleId: number, privilegeId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM RolePrivileges WHERE role_id = ? AND privilege_id = ?',
        [roleId, privilegeId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing privilege from role:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default db;
