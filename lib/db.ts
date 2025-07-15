// Client-side database interface - only makes API calls, no direct database connection
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

// Discovered database interfaces for real MariaDB discovery
export interface DiscoveredDatabase {
  database_name: string;
  charset: string;
  collation: string;
  type: string;
}

export interface DiscoveredTable {
  database_name: string;
  table_name: string;
  table_type: string;
  engine?: string;
  row_count: number;
  data_length: number;
  created_at?: string;
  comment?: string;
  type: string;
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

export interface UserEffectivePrivileges {
  rolePrivileges: Privilege[];
  directPrivileges: UserSpecificPrivilege[];
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

export interface RolePrivilege {
  role_id: number;
  privilege_id: number;
  assigned_at: string;
}

// Discovery methods for real MariaDB databases
export interface DiscoveredDatabase {
  database_name: string;
  // Add other properties as needed
}

export interface DiscoveredTable {
  table_name: string;
  // Add other properties as needed
}

// Client-side API wrapper
export const db = {
  // Initialize - just a placeholder for client side
  async init(): Promise<void> {
    // No-op for client side
  },

  // Database User operations
  async getDatabaseUsers(): Promise<DatabaseUser[]> {
    const response = await fetch('/api/users');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch database users');
    }
    return data.data;
  },

  async getDatabaseUserById(id: number): Promise<DatabaseUser | null> {
    const response = await fetch(`/api/users/${id}`);
    if (response.status === 404) {
      return null;
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch database user');
    }
    return data.data;
  },

  async createDatabaseUser(userData: { username: string; host?: string; description?: string; password?: string }): Promise<DatabaseUser> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create database user');
    }
    return data.data;
  },

  async updateDatabaseUser(id: number, userData: Partial<{ username: string; host: string; description: string }>): Promise<DatabaseUser | null> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (response.status === 404) {
      return null;
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update database user');
    }
    return data.data;
  },

  async deleteDatabaseUser(id: number): Promise<boolean> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete database user');
    }
    return true;
  },

  // Role operations
  async getRoles(): Promise<Role[]> {
    const response = await fetch('/api/roles');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch roles');
    }
    return data.data;
  },

  async getRoleById(id: number): Promise<Role | null> {
    const response = await fetch(`/api/roles/${id}`);
    if (response.status === 404) {
      return null;
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch role');
    }
    return data.data;
  },

  async createRole(roleData: { name: string; description?: string }): Promise<Role> {
    const response = await fetch('/api/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create role');
    }
    return data.data;
  },

  async updateRole(id: number, roleData: Partial<{ name: string; description: string }>): Promise<Role | null> {
    const response = await fetch(`/api/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    if (response.status === 404) {
      return null;
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update role');
    }
    return data.data;
  },

  async deleteRole(id: number): Promise<boolean> {
    const response = await fetch(`/api/roles/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete role');
    }
    return true;
  },

  // Privilege operations
  async getPrivileges(): Promise<Privilege[]> {
    const response = await fetch('/api/privileges');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch privileges');
    }
    return data.data;
  },

  async getPrivilegeById(id: number): Promise<Privilege | null> {
    const response = await fetch(`/api/privileges/${id}`);
    if (response.status === 404) {
      return null;
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch privilege');
    }
    return data.data;
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
    const response = await fetch('/api/privileges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(privilegeData),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create privilege');
    }
    return data.data;
  },

  async updatePrivilege(id: number, privilegeData: Partial<{ name: string; description: string }>): Promise<Privilege | null> {
    const response = await fetch(`/api/privileges/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(privilegeData),
    });
    if (response.status === 404) {
      return null;
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update privilege');
    }
    return data.data;
  },

  async deletePrivilege(id: number): Promise<boolean> {
    const response = await fetch(`/api/privileges/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete privilege');
    }
    return true;
  },

  // Database User Role operations
  async getDatabaseUserRoles(dbUserId: number): Promise<Role[]> {
    const response = await fetch(`/api/users/${dbUserId}/roles`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch database user roles');
    }
    return data.data;
  },

  async assignRoleToDatabaseUser(dbUserId: number, roleId: number): Promise<void> {
    const response = await fetch(`/api/users/${dbUserId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleId }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to assign role to database user');
    }
  },

  async assignRolesToDatabaseUser(dbUserId: number, roleIds: number[]): Promise<void> {
    const response = await fetch(`/api/users/${dbUserId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleIds }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Failed to assign roles" }));
      throw new Error(data.error || "Failed to assign roles");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to assign roles");
    }
  },

  // Apply MySQL privileges to database user based on assigned roles
  async applyPrivilegesToDatabaseUser(dbUserId: number, databaseName?: string): Promise<void> {
    const response = await fetch(`/api/users/${dbUserId}/apply-privileges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ databaseName: databaseName || '*' }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Failed to apply privileges" }));
      throw new Error(data.error || "Failed to apply privileges");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to apply privileges");
    }
  },

  // Role Privilege operations
  async getRolePrivileges(roleId: number): Promise<Privilege[]> {
    const response = await fetch(`/api/roles/${roleId}/privileges`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch role privileges');
    }
    return data.data;
  },

  async assignPrivilegeToRole(roleId: number, privilegeId: number): Promise<void> {
    const response = await fetch(`/api/roles/${roleId}/privileges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ privilegeId }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to assign privilege to role');
    }
  },

  async removePrivilegeFromRole(roleId: number, privilegeId: number): Promise<boolean> {
    const response = await fetch(`/api/roles/${roleId}/privileges/${privilegeId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to remove privilege from role');
    }
    return true;
  },

  async assignPrivilegesToRole(roleId: number, privilegeIds: number[]): Promise<void> {
    const response = await fetch(`/api/roles/${roleId}/privileges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ privilegeIds }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Failed to assign privileges" }));
      throw new Error(data.error || "Failed to assign privileges");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to assign privileges");
    }
  },

  async getRolesForPrivilege(privilegeId: number): Promise<Role[]> {
    const response = await fetch(`/api/privileges/${privilegeId}/roles`);
    const data = await response.json();
    // The API route doesn't return a `success` property, so we check for response.ok
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch roles for privilege');
    }
    return data;
  },

  async assignRolesToPrivilege(privilegeId: number, roleIds: number[]): Promise<void> {
    const response = await fetch(`/api/privileges/${privilegeId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleIds }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to assign roles to privilege');
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch('/api/health');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Health check failed');
    }
    return data.data;
  },

  // Database operations
  async getDatabases(): Promise<DatabaseObject[]> {
    const response = await fetch('/api/databases');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch databases');
    }
    return data.data;
  },

  async getTablesForDatabase(databaseName: string): Promise<DatabaseObject[]> {
    const response = await fetch(`/api/databases/${encodeURIComponent(databaseName)}/tables`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch tables');
    }
    return data.data;
  },

  // User Specific Privileges operations
  async getUserEffectivePrivileges(userId: number): Promise<UserEffectivePrivileges> {
    const response = await fetch(`/api/users/${userId}/privileges`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch user privileges');
    }
    return data.data;
  },

  async grantUserSpecificPrivilege(data: {
    userId: number;
    privilegeType: string;
    targetDatabase: string;
    targetTable?: string;
    grantedBy?: string;
  }): Promise<UserSpecificPrivilege> {
    const response = await fetch(`/api/users/${data.userId}/privileges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privilegeType: data.privilegeType,
        targetDatabase: data.targetDatabase,
        targetTable: data.targetTable,
        grantedBy: data.grantedBy,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to grant privilege');
    }
    return result.data;
  },

  async revokeUserSpecificPrivilege(userId: number, privilegeId: number): Promise<void> {
    const response = await fetch(`/api/users/${userId}/privileges/${privilegeId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to revoke privilege');
    }
  },

  // Scoped Role Assignment operations
  async assignScopedRoleToUser(data: {
    dbUserId: number;
    roleId: number;
    scopeType: 'GLOBAL' | 'DATABASE' | 'TABLE';
    targetDatabase?: string;
    targetTable?: string;
    assignedBy?: string;
  }): Promise<ScopedRoleAssignment> {
    const response = await fetch(`/api/users/${data.dbUserId}/scoped-roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleId: data.roleId,
        scopeType: data.scopeType,
        targetDatabase: data.targetDatabase,
        targetTable: data.targetTable,
        assignedBy: data.assignedBy,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to assign scoped role');
    }
    return result.data;
  },

  async revokeScopedRoleFromUser(userId: number, userRoleId: number): Promise<void> {
    const response = await fetch(`/api/users/${userId}/scoped-roles/${userRoleId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to revoke scoped role');
    }
  },

  async getUserScopedRoles(userId: number): Promise<ScopedRoleAssignment[]> {
    const response = await fetch(`/api/users/${userId}/scoped-roles`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch user scoped roles');
    }
    return data.data;
  },

  // Discovery methods for real MariaDB databases
  async getDiscoveredDatabases(): Promise<DiscoveredDatabase[]> {
    const response = await fetch('/api/discover/databases');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to discover databases');
    }
    return data.data;
  },

  async getDiscoveredTablesForDatabase(databaseName: string): Promise<DiscoveredTable[]> {
    const response = await fetch(`/api/discover/databases/${encodeURIComponent(databaseName)}/tables`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to discover tables');
    }
    return data.data;
  },

  async assignScopedRoleToMultipleTables(data: {
    dbUserId: number;
    roleId: number;
    scopeType: 'TABLE';
    targetDatabase: string;
    targetTables: string[];
    assignedBy?: string;
  }): Promise<{
    assignments: ScopedRoleAssignment[];
    errors: Array<{ table: string; error: string }>;
    totalRequested: number;
    successfulAssignments: number;
    failedAssignments: number;
  }> {
    const response = await fetch(`/api/users/${data.dbUserId}/scoped-roles/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleId: data.roleId,
        scopeType: data.scopeType,
        targetDatabase: data.targetDatabase,
        targetTables: data.targetTables,
        assignedBy: data.assignedBy,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to assign scoped roles to multiple tables');
    }
    return result.data;
  },
};

export default db;
