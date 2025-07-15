/**
 * Enhanced database operations with caching and performance optimizations
 */

import { pool } from './database-config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import 'server-only';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

function getCacheKey(operation: string, params?: any): string {
  return `${operation}:${JSON.stringify(params || {})}`;
}

function getFromCache(key: string): any {
  const entry = cache.get(key) as CacheEntry;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - (entry as CacheEntry).timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);

export class FastDbOperations {
  
  // Optimized batch query execution
  static async executeBatch<T extends RowDataPacket[]>(queries: Array<{sql: string, params?: any[]}>): Promise<T[]> {
    const connection = await pool.getConnection();
    try {
      const promises = queries.map(({sql, params}) => 
        connection.execute<T>(sql, params || [])
      );
      const results = await Promise.all(promises);
      return results.map(result => result[0]);
    } finally {
      connection.release();
    }
  }

  // Cached user operations
  static async getAllUsersFast(): Promise<any[]> {
    const cacheKey = getCacheKey('users:all');
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        db_user_id, username, host, description, created_at,
        (SELECT COUNT(*) FROM user_roles WHERE user_roles.db_user_id = db_users.db_user_id) as role_count
      FROM db_users 
      ORDER BY created_at DESC
    `);
    
    setCache(cacheKey, rows);
    return rows;
  }

  // Optimized dashboard stats
  static async getDashboardStats(): Promise<any> {
    const cacheKey = getCacheKey('dashboard:stats');
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const queries = [
      { sql: 'SELECT COUNT(*) as count FROM db_users', params: [] },
      { sql: 'SELECT COUNT(*) as count FROM roles', params: [] },
      { sql: 'SELECT COUNT(*) as count FROM privileges', params: [] },
      { sql: 'SELECT COUNT(*) as count FROM user_roles', params: [] }
    ];

    const results = await this.executeBatch(queries);
    const stats = {
      users: results[0][0].count,
      roles: results[1][0].count,
      privileges: results[2][0].count,
      assignments: results[3][0].count
    };

    setCache(cacheKey, stats);
    return stats;
  }

  // Optimized user privileges with single query
  static async getUserPrivilegesFast(userId: number): Promise<any[]> {
    const cacheKey = getCacheKey('user:privileges', { userId });
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT DISTINCT
        p.privilege_id,
        p.name,
        p.description,
        p.privilege_type,
        p.target_database,
        p.target_table,
        'role' as assignment_type,
        r.name as role_name
      FROM privileges p
      JOIN role_privileges rp ON p.privilege_id = rp.privilege_id
      JOIN roles r ON rp.role_id = r.role_id
      JOIN user_roles ur ON r.role_id = ur.role_id
      WHERE ur.db_user_id = ?
      
      UNION
      
      SELECT DISTINCT
        p.privilege_id,
        p.name,
        p.description,
        p.privilege_type,
        up.target_database,
        up.target_table,
        'direct' as assignment_type,
        NULL as role_name
      FROM privileges p
      JOIN user_specific_privileges up ON p.privilege_id = up.privilege_id
      WHERE up.db_user_id = ?
      
      ORDER BY name
    `, [userId, userId]);

    setCache(cacheKey, rows);
    return rows;
  }

  // Clear specific cache entries
  static clearUserCache(userId?: number): void {
    if (userId) {
      const patterns = [`user:privileges:${JSON.stringify({userId})}`];
      patterns.forEach(pattern => {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      });
    }
    
    // Clear general caches that might be affected
    cache.delete(getCacheKey('users:all'));
    cache.delete(getCacheKey('dashboard:stats'));
  }

  // Clear all cache
  static clearAllCache(): void {
    cache.clear();
  }
}

export default FastDbOperations;
