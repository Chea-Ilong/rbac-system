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
  created_at: string;
}

export interface DatabaseUserRole {
  db_user_id: number;
  role_id: number;
  assigned_at: string;
}

export interface RolePrivilege {
  role_id: number;
  privilege_id: number;
  assigned_at: string;
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

  async createPrivilege(privilegeData: { name: string; description?: string }): Promise<Privilege> {
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
  }
};

export default db;
