// This file should only be imported in server-side code (API routes, server actions, etc.)
import { pool } from './database-config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Add 'server-only' to ensure this is only used on server side
import 'server-only';

// Type definitions
export interface DatabaseUser {
  db_user_id: number;
  username: string;
  host: string;
  description?: string;
  created_at: string;
}

export interface Role {
  role_id: number;
  name: string;
  description: string;
  is_database_role: boolean;
  created_at: string;
}

export interface Privilege {
  privilege_id: number;
  name: string;
  description: string;
  privilege_type: 'DATABASE' | 'TABLE' | 'COLUMN' | 'ROUTINE';
  target_object?: string;
  target_database?: string;
  target_table?: string;
  mysql_privilege?: string;
  is_global: boolean;
  created_at: string;
}

export interface DatabaseObject {
  object_id: number;
  object_type: 'DATABASE' | 'TABLE';
  database_name: string;
  table_name?: string;
  description?: string;
  created_at: string;
}

export interface UserSpecificPrivilege {
  user_privilege_id: number;
  db_user_id: number;
  privilege_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER' | 'INDEX' | 'GRANT';
  target_database: string;
  target_table?: string;
  granted_at: string;
  granted_by: string;
}

export interface ScopedRoleAssignment {
  user_role_id: number;
  db_user_id: number;
  role_id: number;
  role_name: string;
  scope_type: 'GLOBAL' | 'DATABASE' | 'TABLE';
  target_database?: string;
  target_table?: string;
  assigned_at: string;
  assigned_by: string;
  is_active: boolean;
}

export interface EffectivePrivilege {
  privilege_name: string;
  mysql_privilege: string;
  privilege_type: string;
  effective_scope: string;
  source: 'role' | 'direct';
  role_name?: string;
  target_database?: string;
  target_table?: string;
}

export interface DatabaseUserRole {
  user_role_id: number;
  db_user_id: number;
  role_id: number;
  scope_type: 'GLOBAL' | 'DATABASE' | 'TABLE';
  target_database?: string;
  target_table?: string;
  assigned_at: string;
  assigned_by: string;
  is_active: boolean;
}

export interface RolePrivilege {
  role_id: number;
  privilege_id: number;
  assigned_at: string;
}

// Server-side database implementation
export const serverDb = {
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

  // Database User operations
  async getDatabaseUsers(): Promise<DatabaseUser[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM DatabaseUsers ORDER BY created_at DESC');
      return rows as DatabaseUser[];
    } catch (error) {
      console.error('Error fetching database users:', error);
      throw error;
    }
  },

  async getDatabaseUserById(id: number): Promise<DatabaseUser | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM DatabaseUsers WHERE db_user_id = ?', [id]);
      return rows.length > 0 ? rows[0] as DatabaseUser : null;
    } catch (error) {
      console.error('Error fetching database user:', error);
      throw error;
    }
  },

  async getDatabaseUserByUsername(username: string, host: string = '%'): Promise<DatabaseUser | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM DatabaseUsers WHERE username = ? AND host = ?', [username, host]);
      return rows.length > 0 ? rows[0] as DatabaseUser : null;
    } catch (error) {
      console.error('Error fetching database user by username:', error);
      throw error;
    }
  },

  async createDatabaseUser(userData: { username: string; host?: string; description?: string; password?: string }): Promise<DatabaseUser> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if user already exists
      const existingUser = await this.getDatabaseUserByUsername(userData.username, userData.host || '%');
      if (existingUser) {
        throw new Error(`Database user ${userData.username}@${userData.host || '%'} already exists`);
      }

      // Create user in our tracking table
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO DatabaseUsers (username, host, description) VALUES (?, ?, ?)',
        [userData.username, userData.host || '%', userData.description || '']
      );

      // Create actual MySQL user if password is provided
      if (userData.password) {
        // Escape the username and host for MySQL user creation
        const escapedUsername = connection.escape(userData.username).replace(/'/g, '');
        const escapedHost = connection.escape(userData.host || '%').replace(/'/g, '');
        const escapedPassword = connection.escape(userData.password);
        
        const createUserQuery = `CREATE USER '${escapedUsername}'@'${escapedHost}' IDENTIFIED BY ${escapedPassword}`;
        await connection.execute(createUserQuery);
        
        console.log(`✅ Created MySQL user: ${userData.username}@${userData.host || '%'}`);
      }

      await connection.commit();

      const newUser = await this.getDatabaseUserById(result.insertId);
      if (!newUser) {
        throw new Error('Failed to retrieve created database user');
      }

      return newUser;
    } catch (error) {
      await connection.rollback();
      console.error('Error creating database user:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateDatabaseUser(id: number, userData: Partial<{ username: string; host: string; description: string }>): Promise<DatabaseUser | null> {
    try {
      const fields = [];
      const values = [];

      if (userData.username !== undefined) {
        fields.push('username = ?');
        values.push(userData.username);
      }
      if (userData.host !== undefined) {
        fields.push('host = ?');
        values.push(userData.host);
      }
      if (userData.description !== undefined) {
        fields.push('description = ?');
        values.push(userData.description);
      }

      if (fields.length === 0) {
        return this.getDatabaseUserById(id);
      }

      values.push(id);
      await pool.execute(
        `UPDATE DatabaseUsers SET ${fields.join(', ')} WHERE db_user_id = ?`,
        values
      );

      return this.getDatabaseUserById(id);
    } catch (error) {
      console.error('Error updating database user:', error);
      throw error;
    }
  },

  async deleteDatabaseUser(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get user details first
      const user = await this.getDatabaseUserById(id);
      if (!user) {
        return false;
      }

      // Drop actual MySQL user
      try {
        const escapedUsername = connection.escape(user.username).replace(/'/g, '');
        const escapedHost = connection.escape(user.host).replace(/'/g, '');
        const dropUserQuery = `DROP USER '${escapedUsername}'@'${escapedHost}'`;
        await connection.execute(dropUserQuery);
        console.log(`✅ Dropped MySQL user: ${user.username}@${user.host}`);
      } catch (error) {
        // User might not exist in MySQL, just log the error
        console.warn(`MySQL user ${user.username}@${user.host} doesn't exist:`, error);
      }

      // Delete from our tracking table
      const [result] = await connection.execute<ResultSetHeader>('DELETE FROM DatabaseUsers WHERE db_user_id = ?', [id]);
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting database user:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Sync database users with MySQL (create MySQL users for existing database users)
  async syncDatabaseUsersWithMySQL(defaultPassword: string = 'temp123'): Promise<void> {
    const connection = await pool.getConnection();
    try {
      // Get all database users
      const databaseUsers = await this.getDatabaseUsers();
      
      // Get existing MySQL users
      const [mysqlUsers] = await connection.execute<RowDataPacket[]>(
        "SELECT User, Host FROM mysql.user"
      );
      const existingUsers = new Set(
        mysqlUsers.map((user: any) => `${user.User}@${user.Host}`)
      );

      let created = 0;
      let skipped = 0;

      for (const dbUser of databaseUsers) {
        const userKey = `${dbUser.username}@${dbUser.host}`;
        
        if (!existingUsers.has(userKey)) {
          try {
            // Create MySQL user with default password
            const escapedUsername = connection.escape(dbUser.username).replace(/'/g, '');
            const escapedHost = connection.escape(dbUser.host).replace(/'/g, '');
            const escapedPassword = connection.escape(defaultPassword);
            
            const createUserQuery = `CREATE USER '${escapedUsername}'@'${escapedHost}' IDENTIFIED BY ${escapedPassword}`;
            await connection.execute(createUserQuery);
            
            console.log(`✅ Created MySQL user: ${dbUser.username}@${dbUser.host}`);
            created++;
          } catch (error) {
            console.error(`❌ Failed to create MySQL user ${dbUser.username}@${dbUser.host}:`, error);
          }
        } else {
          console.log(`ℹ️ MySQL user already exists: ${dbUser.username}@${dbUser.host}`);
          skipped++;
        }
      }

      // Flush privileges to ensure changes take effect
      await connection.execute('FLUSH PRIVILEGES');
      
      console.log(`🎉 Sync complete: ${created} users created, ${skipped} users skipped`);
    } catch (error) {
      console.error('Error syncing database users with MySQL:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Role operations
  async getRoles(): Promise<Role[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM roles ORDER BY created_at DESC');
      return rows as Role[];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getRoleById(id: number): Promise<Role | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM roles WHERE role_id = ?', [id]);
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
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM roles WHERE role_id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  // Privilege operations
  async getPrivileges(): Promise<Privilege[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM privileges ORDER BY created_at DESC');
      return rows as Privilege[];
    } catch (error) {
      console.error('Error fetching privileges:', error);
      throw error;
    }
  },

  async getPrivilegeById(id: number): Promise<Privilege | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM privileges WHERE privilege_id = ?', [id]);
      return rows.length > 0 ? rows[0] as Privilege : null;
    } catch (error) {
      console.error('Error fetching privilege:', error);
      throw error;
    }
  },

  async createPrivilege(privilegeData: { 
    name: string; 
    description?: string;
    privilege_type?: string;
    target_database?: string;
    target_table?: string;
    mysql_privilege?: string;
    is_global?: boolean;
  }): Promise<Privilege> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO Privileges (name, description, privilege_type, target_database, target_table, mysql_privilege, is_global) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          privilegeData.name, 
          privilegeData.description || '',
          privilegeData.privilege_type || 'DATABASE',
          privilegeData.target_database || null,
          privilegeData.target_table || null,
          privilegeData.mysql_privilege || 'SELECT',
          privilegeData.is_global || false
        ]
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

  async updatePrivilege(id: number, privilegeData: Partial<{ name: string; description: string }>): Promise<Privilege | null> {
    try {
      const fields = [];
      const values = [];

      if (privilegeData.name !== undefined) {
        fields.push('name = ?');
        values.push(privilegeData.name);
      }
      if (privilegeData.description !== undefined) {
        fields.push('description = ?');
        values.push(privilegeData.description);
      }

      if (fields.length === 0) {
        return this.getPrivilegeById(id);
      }

      values.push(id);
      await pool.execute(
        `UPDATE Privileges SET ${fields.join(', ')} WHERE privilege_id = ?`,
        values
      );

      return this.getPrivilegeById(id);
    } catch (error) {
      console.error('Error updating privilege:', error);
      throw error;
    }
  },

  async deletePrivilege(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM privileges WHERE privilege_id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting privilege:', error);
      throw error;
    }
  },

  // Database User Role operations (Enhanced with Scoping)
  async getDatabaseUserRoles(dbUserId: number): Promise<ScopedRoleAssignment[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          dur.assignment_id as user_role_id,
          dur.db_user_id,
          dur.role_id,
          r.name as role_name,
          dur.scope_type,
          dur.target_database,
          dur.target_table,
          dur.assigned_at,
          dur.assigned_by,
          TRUE as is_active
         FROM DatabaseUserRoles dur 
         INNER JOIN roles r ON dur.role_id = r.role_id 
         WHERE dur.db_user_id = ?
         ORDER BY dur.assigned_at DESC`,
        [dbUserId]
      );
      return rows as ScopedRoleAssignment[];
    } catch (error) {
      console.error('Error fetching database user roles:', error);
      throw error;
    }
  },

  async assignScopedRoleToDatabaseUser(data: {
    dbUserId: number;
    roleId: number;
    scopeType: 'GLOBAL' | 'DATABASE' | 'TABLE';
    targetDatabase?: string;
    targetTable?: string;
    assignedBy?: string;
  }): Promise<ScopedRoleAssignment> {
    try {
      // Check if this exact assignment already exists
      const [existingAssignments] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM DatabaseUserRoles 
         WHERE db_user_id = ? AND role_id = ? AND scope_type = ? 
         AND target_database = ? AND target_table = ?`,
        [
          data.dbUserId, 
          data.roleId, 
          data.scopeType, 
          data.targetDatabase || null, 
          data.targetTable || null
        ]
      );

      if (existingAssignments.length > 0) {
        // Return the existing assignment instead of creating a duplicate
        const existing = existingAssignments[0];
        return {
          user_role_id: existing.assignment_id,
          db_user_id: existing.db_user_id,
          role_id: existing.role_id,
          role_name: '', // Will be filled by calling code if needed
          scope_type: existing.scope_type,
          target_database: existing.target_database || undefined,
          target_table: existing.target_table || undefined,
          assigned_at: existing.assigned_at,
          assigned_by: existing.assigned_by,
          is_active: true
        };
      }

      // Insert new assignment (no more ON DUPLICATE KEY UPDATE)
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO DatabaseUserRoles (db_user_id, role_id, scope_type, target_database, target_table, assigned_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.dbUserId, 
          data.roleId, 
          data.scopeType, 
          data.targetDatabase || null, 
          data.targetTable || null, 
          data.assignedBy || 'system'
        ]
      );

      // Apply the MySQL privileges for this scoped role assignment
      await this.applyScopedRolePrivileges(
        data.dbUserId,
        data.roleId,
        data.scopeType,
        data.targetDatabase,
        data.targetTable
      );

      // Return the assignment with the actual assignment_id
      const assignment: ScopedRoleAssignment = {
        user_role_id: result.insertId, // Use the actual assignment_id
        db_user_id: data.dbUserId,
        role_id: data.roleId,
        role_name: '', // Will be filled by calling code if needed
        scope_type: data.scopeType,
        target_database: data.targetDatabase || undefined,
        target_table: data.targetTable || undefined,
        assigned_at: new Date().toISOString(),
        assigned_by: data.assignedBy || 'system',
        is_active: true
      };

      return assignment;
    } catch (error) {
      console.error('Error assigning scoped role:', error);
      throw error;
    }
  },

  async revokeScopedRoleFromDatabaseUser(assignmentId: number): Promise<void> {
    try {
      // Get the assignment details before removing using the actual assignment_id
      const [assignments] = await pool.execute<RowDataPacket[]>(
        `SELECT dur.*, r.name as role_name
         FROM DatabaseUserRoles dur 
         INNER JOIN roles r ON dur.role_id = r.role_id 
         WHERE dur.assignment_id = ?`,
        [assignmentId]
      );

      if (assignments.length === 0) {
        throw new Error('Role assignment not found');
      }

      const assignment = assignments[0] as ScopedRoleAssignment;

      // Revoke MySQL privileges for this scoped role assignment
      await this.revokeScopedRolePrivileges(
        assignment.db_user_id, 
        assignment.role_id, 
        assignment.scope_type, 
        assignment.target_database, 
        assignment.target_table
      );

      // Delete the role assignment using assignment_id
      await pool.execute(
        'DELETE FROM DatabaseUserRoles WHERE assignment_id = ?',
        [assignmentId]
      );
    } catch (error) {
      console.error('Error revoking scoped role:', error);
      throw error;
    }
  },

  async getUserScopedRoles(userId: number): Promise<ScopedRoleAssignment[]> {
    try {
      const [assignments] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          dur.assignment_id as user_role_id,
          dur.db_user_id,
          dur.role_id,
          r.name as role_name,
          dur.scope_type,
          dur.target_database,
          dur.target_table,
          dur.assigned_at,
          dur.assigned_by,
          TRUE as is_active
         FROM DatabaseUserRoles dur 
         INNER JOIN roles r ON dur.role_id = r.role_id 
         WHERE dur.db_user_id = ?
         ORDER BY dur.assigned_at DESC`,
        [userId]
      );

      return assignments as ScopedRoleAssignment[];
    } catch (error) {
      console.error('Error fetching user scoped roles:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  async assignRoleToDatabaseUser(dbUserId: number, roleId: number): Promise<void> {
    await this.assignScopedRoleToDatabaseUser({
      dbUserId,
      roleId,
      scopeType: 'GLOBAL',
      assignedBy: 'system'
    });
  },

  async removeRoleFromDatabaseUser(dbUserId: number, roleId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM DatabaseUserRoles WHERE db_user_id = ? AND role_id = ?',
        [dbUserId, roleId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing role from database user:', error);
      throw error;
    }
  },

  async assignRolesToDatabaseUser(dbUserId: number, roleIds: number[]): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // First, remove all existing roles for the user
      await connection.execute('DELETE FROM DatabaseUserRoles WHERE db_user_id = ?', [dbUserId]);

      // Then, insert the new roles
      if (roleIds && roleIds.length > 0) {
        const values = roleIds.map(roleId => [dbUserId, roleId]);
        await connection.query('INSERT INTO DatabaseUserRoles (db_user_id, role_id) VALUES ?', [values]);
      }

      await connection.commit();
      
      // Apply MySQL privileges after role assignment
      await this.applyPrivilegesToDatabaseUser(dbUserId);
    } catch (error) {
      await connection.rollback();
      console.error('Error assigning roles to database user:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Apply privileges to MySQL user based on roles
  async applyPrivilegesToDatabaseUser(dbUserId: number, databaseName: string = '*'): Promise<void> {
    const connection = await pool.getConnection();
    try {
      // Get user details
      const user = await this.getDatabaseUserById(dbUserId);
      if (!user) {
        throw new Error('Database user not found');
      }

      // First, revoke all existing privileges for this user to start clean
      try {
        const escapedUsername = connection.escape(user.username).replace(/'/g, '');
        const escapedHost = connection.escape(user.host).replace(/'/g, '');
        const revokeQuery = `REVOKE ALL PRIVILEGES ON *.* FROM '${escapedUsername}'@'${escapedHost}'`;
        await connection.execute(revokeQuery);
      } catch (error) {
        // User might not exist in MySQL yet, or have no privileges - this is okay
        console.log('Note: Could not revoke existing privileges (user may not exist in MySQL yet)');
      }

      // Get all privileges for user's roles
      const userRoles = await this.getDatabaseUserRoles(dbUserId);
      const privilegeSet = new Set<string>();

      for (const role of userRoles) {
        const rolePrivileges = await this.getRolePrivileges(role.role_id);
        rolePrivileges.forEach(privilege => {
          privilegeSet.add(privilege.name);
        });
      }

      // Convert privileges to MySQL GRANT statements
      const privileges = Array.from(privilegeSet);
      if (privileges.length > 0) {
        // Handle special privilege mappings
        const mysqlPrivileges = privileges.map(priv => {
          switch (priv) {
            case 'ALL PRIVILEGES':
              return 'ALL PRIVILEGES';
            case 'SHOW DATABASES':
              return 'SHOW DATABASES';
            case 'CREATE USER':
              return 'CREATE USER';
            case 'DROP USER':
              return 'DROP'; // Fix: DROP USER should be just DROP for database operations
            case 'GRANT OPTION':
              return 'GRANT OPTION';
            default:
              return priv;
          }
        });

        // Apply privileges
        const escapedUsername = connection.escape(user.username).replace(/'/g, '');
        const escapedHost = connection.escape(user.host).replace(/'/g, '');
        
        for (const privilege of mysqlPrivileges) {
          try {
            if (privilege === 'ALL PRIVILEGES') {
              const grantQuery = `GRANT ALL PRIVILEGES ON ${databaseName}.* TO '${escapedUsername}'@'${escapedHost}'`;
              await connection.execute(grantQuery);
            } else if (['CREATE USER', 'RELOAD', 'SHUTDOWN', 'PROCESS', 'SUPER', 'SHOW DATABASES'].includes(privilege)) {
              // Global privileges (note: removed DROP USER as it should be database-level DROP)
              const grantQuery = `GRANT ${privilege} ON *.* TO '${escapedUsername}'@'${escapedHost}'`;
              await connection.execute(grantQuery);
            } else {
              // Database-level privileges
              const grantQuery = `GRANT ${privilege} ON ${databaseName}.* TO '${escapedUsername}'@'${escapedHost}'`;
              await connection.execute(grantQuery);
            }
          } catch (error) {
            console.error(`Error granting privilege ${privilege}:`, error);
            // Continue with other privileges even if one fails
          }
        }
        
        // Flush privileges to ensure changes take effect
        await connection.execute('FLUSH PRIVILEGES');
        console.log(`✅ Applied privileges [${mysqlPrivileges.join(', ')}] to ${user.username}@${user.host}`);
      } else {
        console.log(`ℹ️ No privileges to apply for ${user.username}@${user.host}`);
      }

    } catch (error) {
      console.error('Error applying privileges to database user:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Role Privilege operations
  async getRolePrivileges(roleId: number): Promise<Privilege[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT p.* FROM privileges p 
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

  async assignPrivilegesToRole(roleId: number, privilegeIds: number[]): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // First, remove all existing privileges for the role
      await connection.execute('DELETE FROM RolePrivileges WHERE role_id = ?', [roleId]);

      // Then, insert the new privileges
      if (privilegeIds && privilegeIds.length > 0) {
        const values = privilegeIds.map(privilegeId => [roleId, privilegeId]);
        await connection.query('INSERT INTO RolePrivileges (role_id, privilege_id) VALUES ?', [values]);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error assigning privileges to role:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  async getRolesForPrivilege(privilegeId: number): Promise<Role[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT r.* FROM roles r
         INNER JOIN RolePrivileges rp ON r.role_id = rp.role_id
         WHERE rp.privilege_id = ?`,
        [privilegeId]
      );
      return rows as Role[];
    } catch (error) {
      console.error('Error fetching roles for privilege:', error);
      throw error;
    }
  },

  async assignRolesToPrivilege(privilegeId: number, roleIds: number[]): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Remove existing roles for this privilege
      await connection.execute('DELETE FROM RolePrivileges WHERE privilege_id = ?', [privilegeId]);

      // Assign new roles
      if (roleIds && roleIds.length > 0) {
        const values = roleIds.map(roleId => [roleId, privilegeId]);
        await connection.query(
          'INSERT INTO RolePrivileges (role_id, privilege_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error assigning roles to privilege:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Stats
  async getStats(): Promise<{ database_users: number; roles: number; privileges: number }> {
    try {
      const [userRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM DatabaseUsers');
      const [roleRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM roles');
      const [privilegeRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM privileges');

      const userCount = userRows[0].count;
      const roleCount = roleRows[0].count;
      const privilegeCount = privilegeRows[0].count;

      return {
        database_users: userCount,
        roles: roleCount,
        privileges: privilegeCount,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
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
  },

  // Database Objects operations
  async getDatabaseObjects(): Promise<DatabaseObject[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM DatabaseObjects ORDER BY database_name, table_name');
      return rows as DatabaseObject[];
    } catch (error) {
      console.error('Error fetching database objects:', error);
      throw error;
    }
  },

  async getDatabases(): Promise<DatabaseObject[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM DatabaseObjects WHERE object_type = "DATABASE" ORDER BY database_name');
      return rows as DatabaseObject[];
    } catch (error) {
      console.error('Error fetching databases:', error);
      throw error;
    }
  },

  async getTablesForDatabase(databaseName: string): Promise<DatabaseObject[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM DatabaseObjects WHERE object_type = "TABLE" AND database_name = ? ORDER BY table_name', [databaseName]);
      return rows as DatabaseObject[];
    } catch (error) {
      console.error('Error fetching tables for database:', error);
      throw error;
    }
  },

  // User Specific Privileges operations
  async getUserSpecificPrivileges(userId: number): Promise<UserSpecificPrivilege[]> {
    try {
      // In our simplified schema, there are no user-specific privileges
      // All privileges come through role assignments
      return [];
    } catch (error) {
      console.error('Error fetching user specific privileges:', error);
      throw error;
    }
  },

  async grantUserSpecificPrivilege(data: {
    userId: number;
    privilegeType: string;
    targetDatabase: string;
    targetTable?: string;
    grantedBy?: string;
  }): Promise<UserSpecificPrivilege> {
    try {
      const { userId, privilegeType, targetDatabase, targetTable, grantedBy } = data;

      // First check if this privilege is already granted to avoid duplicates
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM UserSpecificPrivileges 
         WHERE db_user_id = ? AND privilege_type = ? AND target_database = ? AND target_table = ?`,
        [userId, privilegeType, targetDatabase, targetTable || null]
      );

      if (existing.length > 0) {
        // Return the existing privilege instead of throwing an error
        return existing[0] as UserSpecificPrivilege;
      }

      // Insert the privilege grant record
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO UserSpecificPrivileges (db_user_id, privilege_type, target_database, target_table, granted_by)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, privilegeType, targetDatabase, targetTable || null, grantedBy || 'admin']
      );

      // Apply the MySQL privilege
      await this.applyMySQLPrivilege(userId, privilegeType, targetDatabase, targetTable);

      // Return the created privilege
      const [created] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM UserSpecificPrivileges WHERE user_privilege_id = ?`,
        [result.insertId]
      );

      return created[0] as UserSpecificPrivilege;
    } catch (error) {
      console.error('Error granting user specific privilege:', error);
      throw error;
    }
  },

  async revokeUserSpecificPrivilege(userId: number, privilegeId: number): Promise<void> {
    try {
      // Get the privilege details before revoking
      const [privileges] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM UserSpecificPrivileges WHERE user_privilege_id = ? AND db_user_id = ?`,
        [privilegeId, userId]
      );

      if (privileges.length === 0) {
        throw new Error('Privilege not found or not assigned to this user');
      }

      const privilege = privileges[0] as UserSpecificPrivilege;

      // Revoke the MySQL privilege
      await this.revokeMySQLPrivilege(
        userId, 
        privilege.privilege_type, 
        privilege.target_database, 
        privilege.target_table || undefined
      );

      // Remove the privilege record
      await pool.execute(
        'DELETE FROM UserSpecificPrivileges WHERE user_privilege_id = ?',
        [privilegeId]
      );
    } catch (error) {
      console.error('Error revoking user specific privilege:', error);
      throw error;
    }
  },

  async applyMySQLPrivilege(userId: number, privilegeType: string, targetDatabase: string, targetTable?: string): Promise<void> {
    try {
      // Get user details
      const user = await this.getDatabaseUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const username = user.username;
      const host = user.host;

      // Build GRANT statement
      let grantStatement: string;
      if (targetTable) {
        grantStatement = `GRANT ${privilegeType} ON \`${targetDatabase}\`.\`${targetTable}\` TO '${username}'@'${host}'`;
      } else {
        grantStatement = `GRANT ${privilegeType} ON \`${targetDatabase}\`.* TO '${username}'@'${host}'`;
      }

      console.log('Executing GRANT statement:', grantStatement);
      await pool.execute(grantStatement);
      await pool.execute('FLUSH PRIVILEGES');
    } catch (error) {
      console.error('Error applying MySQL privilege:', error);
      throw error;
    }
  },

  async revokeMySQLPrivilege(userId: number, privilegeType: string, targetDatabase: string, targetTable?: string): Promise<void> {
    try {
      // Get user details
      const user = await this.getDatabaseUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const username = user.username;
      const host = user.host;

      // Build REVOKE statement
      let revokeStatement: string;
      if (targetTable) {
        revokeStatement = `REVOKE ${privilegeType} ON \`${targetDatabase}\`.\`${targetTable}\` FROM '${username}'@'${host}'`;
      } else {
        revokeStatement = `REVOKE ${privilegeType} ON \`${targetDatabase}\`.* FROM '${username}'@'${host}'`;
      }

      console.log('Executing REVOKE statement:', revokeStatement);
      await pool.execute(revokeStatement);
      await pool.execute('FLUSH PRIVILEGES');
    } catch (error) {
      console.error('Error revoking MySQL privilege:', error);
      throw error;
    }
  },

  async getUserEffectivePrivileges(userId: number): Promise<{
    rolePrivileges: Privilege[];
    directPrivileges: UserSpecificPrivilege[];
  }> {
    try {
      // Get privileges from roles
      const [rolePrivileges] = await pool.execute<RowDataPacket[]>(`
        SELECT DISTINCT p.* 
        FROM privileges p
        JOIN RolePrivileges rp ON p.privilege_id = rp.privilege_id
        JOIN DatabaseUserRoles dur ON rp.role_id = dur.role_id
        WHERE dur.db_user_id = ?
      `, [userId]);

      // Get direct user-specific privileges
      const [directPrivileges] = await pool.execute<RowDataPacket[]>(`
        SELECT * FROM UserSpecificPrivileges 
        WHERE db_user_id = ?
        ORDER BY granted_at DESC
      `, [userId]);

      return {
        rolePrivileges: rolePrivileges as Privilege[],
        directPrivileges: directPrivileges as UserSpecificPrivilege[]
      };
    } catch (error) {
      console.error('Error fetching user effective privileges:', error);
      throw error;
    }
  },

  async applyScopedRolePrivileges(
    userId: number, 
    roleId: number, 
    scopeType: 'GLOBAL' | 'DATABASE' | 'TABLE', 
    targetDatabase?: string, 
    targetTable?: string
  ): Promise<void> {
    try {
      // Get user details
      const user = await this.getDatabaseUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has ALL PRIVILEGES - if so, skip this operation
      try {
        const [existing] = await pool.execute(`SHOW GRANTS FOR '${user.username}'@'${user.host}'`);
        const grants = existing as any[];
        const hasAllPrivileges = grants.some(grant => {
          const grantString = Object.values(grant as Record<string, any>)[0]?.toString() || '';
          return grantString.includes('ALL PRIVILEGES ON *.*');
        });
        
        if (hasAllPrivileges) {
          console.log(`User ${user.username}@${user.host} already has ALL PRIVILEGES, skipping role privilege assignment`);
          return;
        }
      } catch (showGrantsError) {
        console.warn('Could not check existing grants, proceeding with assignment:', showGrantsError);
      }

      // Get role privileges
      const [rolePrivileges] = await pool.execute<RowDataPacket[]>(
        `SELECT p.mysql_privilege 
         FROM privileges p
         JOIN RolePrivileges rp ON p.privilege_id = rp.privilege_id
         WHERE rp.role_id = ?`,
        [roleId]
      );

      const username = user.username;
      const host = user.host;

      // Apply each privilege with the specified scope
      for (const priv of rolePrivileges) {
        let grantStatement: string;
        
        // Ensure we have valid privilege type
        if (!priv.mysql_privilege) {
          console.warn('Skipping privilege with no mysql_privilege defined');
          continue;
        }
        
        // Check if this is a global-only privilege
        const globalOnlyPrivileges = ['CREATE USER', 'DROP USER', 'RELOAD', 'PROCESS', 'SUPER', 'SHUTDOWN', 'REPLICATION SLAVE', 'REPLICATION CLIENT', 'FILE'];
        const isGlobalOnly = globalOnlyPrivileges.includes(priv.mysql_privilege.toUpperCase());
        
        // Normalize null values - handle both null and string 'null'
        const normalizedDatabase = targetDatabase && targetDatabase !== 'null' ? targetDatabase : null;
        const normalizedTable = targetTable && targetTable !== 'null' ? targetTable : null;
        
        if (scopeType === 'GLOBAL' || isGlobalOnly) {
          grantStatement = `GRANT ${priv.mysql_privilege} ON *.* TO '${username}'@'${host}'`;
        } else if (scopeType === 'DATABASE' && normalizedDatabase && !isGlobalOnly) {
          grantStatement = `GRANT ${priv.mysql_privilege} ON \`${normalizedDatabase}\`.* TO '${username}'@'${host}'`;
        } else if (scopeType === 'TABLE' && normalizedDatabase && normalizedTable && !isGlobalOnly) {
          grantStatement = `GRANT ${priv.mysql_privilege} ON \`${normalizedDatabase}\`.\`${normalizedTable}\` TO '${username}'@'${host}'`;
        } else {
          if (isGlobalOnly && (scopeType === 'DATABASE' || scopeType === 'TABLE')) {
            console.warn(`Privilege ${priv.mysql_privilege} can only be granted globally, converting to global scope`);
            grantStatement = `GRANT ${priv.mysql_privilege} ON *.* TO '${username}'@'${host}'`;
          } else {
            console.warn(`Skipping invalid scope combination: scopeType=${scopeType}, targetDatabase=${targetDatabase}, targetTable=${targetTable}`);
            continue; // Skip invalid scope combinations
          }
        }

        console.log('Executing scoped GRANT statement:', grantStatement);
        await pool.execute(grantStatement);
      }

      await pool.execute('FLUSH PRIVILEGES');
    } catch (error) {
      console.error('Error applying scoped role privileges:', error);
      throw error;
    }
  },

  async revokeScopedRolePrivileges(
    userId: number, 
    roleId: number, 
    scopeType: 'GLOBAL' | 'DATABASE' | 'TABLE', 
    targetDatabase?: string, 
    targetTable?: string
  ): Promise<void> {
    try {
      // Get user details
      const user = await this.getDatabaseUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get role privileges
      const [rolePrivileges] = await pool.execute<RowDataPacket[]>(
        `SELECT p.mysql_privilege 
         FROM privileges p
         JOIN RolePrivileges rp ON p.privilege_id = rp.privilege_id
         WHERE rp.role_id = ?`,
        [roleId]
      );

      const username = user.username;
      const host = user.host;

      // Revoke each privilege with the specified scope
      for (const priv of rolePrivileges) {
        let revokeStatement: string;
        
        // Ensure we have valid privilege type
        if (!priv.mysql_privilege) {
          console.warn('Skipping privilege with no mysql_privilege defined');
          continue;
        }
        
        // Check if this is a global-only privilege
        const globalOnlyPrivileges = ['CREATE USER', 'DROP USER', 'RELOAD', 'PROCESS', 'SUPER', 'SHUTDOWN', 'REPLICATION SLAVE', 'REPLICATION CLIENT', 'FILE'];
        const isGlobalOnly = globalOnlyPrivileges.includes(priv.mysql_privilege.toUpperCase());
        
        // Normalize null values - handle both null and string 'null'
        const normalizedDatabase = targetDatabase && targetDatabase !== 'null' ? targetDatabase : null;
        const normalizedTable = targetTable && targetTable !== 'null' ? targetTable : null;
        
        if (scopeType === 'GLOBAL' || isGlobalOnly) {
          revokeStatement = `REVOKE ${priv.mysql_privilege} ON *.* FROM '${username}'@'${host}'`;
        } else if (scopeType === 'DATABASE' && normalizedDatabase && !isGlobalOnly) {
          revokeStatement = `REVOKE ${priv.mysql_privilege} ON \`${normalizedDatabase}\`.* FROM '${username}'@'${host}'`;
        } else if (scopeType === 'TABLE' && normalizedDatabase && normalizedTable && !isGlobalOnly) {
          revokeStatement = `REVOKE ${priv.mysql_privilege} ON \`${normalizedDatabase}\`.\`${normalizedTable}\` FROM '${username}'@'${host}'`;
        } else {
          if (isGlobalOnly && (scopeType === 'DATABASE' || scopeType === 'TABLE')) {
            console.warn(`Privilege ${priv.mysql_privilege} can only be revoked globally, converting to global scope`);
            revokeStatement = `REVOKE ${priv.mysql_privilege} ON *.* FROM '${username}'@'${host}'`;
          } else {
            console.warn(`Skipping invalid scope combination: scopeType=${scopeType}, targetDatabase=${targetDatabase}, targetTable=${targetTable}`);
            continue; // Skip invalid scope combinations
          }
        }

        console.log('Executing scoped REVOKE statement:', revokeStatement);
        await pool.execute(revokeStatement);
      }

      await pool.execute('FLUSH PRIVILEGES');
    } catch (error) {
      console.error('Error revoking scoped role privileges:', error);
      throw error;
    }
  },
};

export default serverDb;
