// Client-side authentication utilities
export interface AuthUser {
  user_id: number;
  name: string;
  username: string;
  roles: string[];
  privileges: string[];
}

// In-memory storage for current user (in production, use secure storage like cookies/JWT)
let currentUser: AuthUser | null = null;

export const auth = {
  // Login through API
  login: async (name: string, password: string): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        currentUser = data.user;
        return currentUser;
      }
      
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      currentUser = null;
    }
  },

  // Get current user
  getCurrentUser: (): AuthUser | null => {
    return currentUser;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return currentUser !== null;
  },

  // Check if user has specific role
  hasRole: (roleName: string): boolean => {
    if (!currentUser) return false;
    return currentUser.roles.includes(roleName);
  },

  // Check if user has specific privilege
  hasPrivilege: (privilegeName: string): boolean => {
    if (!currentUser) return false;
    return currentUser.privileges.includes(privilegeName);
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roleNames: string[]): boolean => {
    if (!currentUser) return false;
    return roleNames.some(role => currentUser!.roles.includes(role));
  },

  // Check if user has any of the specified privileges
  hasAnyPrivilege: (privilegeNames: string[]): boolean => {
    if (!currentUser) return false;
    return privilegeNames.some(privilege => currentUser!.privileges.includes(privilege));
  },

  // Refresh user data
  refresh: async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        currentUser = data.user;
        return currentUser;
      }
      
      currentUser = null;
      return null;
    } catch (error) {
      console.error('Refresh error:', error);
      currentUser = null;
      return null;
    }
  },
};

export default auth;
