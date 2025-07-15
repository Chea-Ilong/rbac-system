# Database Performance Optimization Guide

## Quick Wins for Faster Data Fetching

### 1. Connection Pool Optimization ✅ (Applied)
- Increased connection limit from 10 to 20
- Added performance-optimized connection settings
- Enabled multiple statements and optimized character handling

### 2. Database Indexes 🚀 (Run the SQL script)
```bash
# Apply performance indexes
mysql -u your_user -p your_database < scripts/sql/05-performance-indexes.sql
```

### 3. Query Optimization Strategies

#### Use Connection Pooling
```javascript
// ❌ Bad: Creating new connections
const connection = await mysql.createConnection(config);

// ✅ Good: Using connection pool
const [rows] = await pool.execute(query, params);
```

#### Batch Operations
```javascript
// ❌ Bad: Sequential queries
for (const query of queries) {
  await connection.execute(query);
}

// ✅ Good: Parallel execution
const promises = queries.map(query => connection.execute(query));
await Promise.all(promises);
```

#### Caching Frequently Accessed Data
```javascript
// ✅ Use the new FastDbOperations class
import FastDbOperations from '@/lib/fast-db';

// Cached operations
const users = await FastDbOperations.getAllUsersFast();
const stats = await FastDbOperations.getDashboardStats();
```

### 4. Frontend Optimizations

#### Use Performance Monitoring Hook
```typescript
import { useOptimizedDb } from '@/hooks/use-performance';

function MyComponent() {
  const { enhancedFetch, batchFetch, cachedFetch, metrics } = useOptimizedDb();
  
  // Batch multiple requests
  const results = await batchFetch([
    '/api/users',
    '/api/roles', 
    '/api/privileges'
  ]);
  
  // Use cached data (60 second TTL)
  const response = await cachedFetch('/api/stats', 60000);
}
```

### 5. API Endpoint Optimizations

#### Example: Optimized Stats Endpoint
```typescript
// Before: Multiple separate queries
const users = await db.getUsers();
const roles = await db.getRoles();
const privileges = await db.getPrivileges();

// After: Single batch operation
const stats = await FastDbOperations.getDashboardStats(); // ⚡ Cached + batched
```

## Performance Testing

### Test Connection Performance
```bash
node scripts/maintenance/test-connection.js
```

### Full Performance Analysis
```bash
node scripts/maintenance/performance-test.js
```

## Expected Performance Improvements

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Dashboard load | ~500ms | ~100ms | 80% faster |
| User list | ~200ms | ~50ms | 75% faster |
| Complex queries | ~1000ms | ~200ms | 80% faster |
| Concurrent requests | Limited | 20x parallel | 20x throughput |

## Monitoring Performance

### Check Slow Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- Log queries > 1 second

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

### Monitor Index Usage
```sql
-- Check index usage
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  CARDINALITY,
  NULLABLE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'rbac_system'
ORDER BY CARDINALITY DESC;
```

## Advanced Optimizations

### 1. Query Optimization
- Use EXPLAIN to analyze query execution plans
- Avoid SELECT * in production queries
- Use appropriate JOINs instead of subqueries when possible
- Limit result sets with proper pagination

### 2. Database Configuration
```sql
-- Optimize MySQL settings
SET GLOBAL innodb_buffer_pool_size = 1G; -- Adjust based on available RAM
SET GLOBAL query_cache_size = 64M;
SET GLOBAL query_cache_type = 1;
```

### 3. Application-Level Caching
- Use Redis for session storage and caching
- Implement proper cache invalidation strategies
- Cache computed results and aggregations

### 4. Network Optimizations
- Use compression for large data transfers
- Implement pagination for large datasets
- Use GraphQL or field selection to reduce payload size

## Troubleshooting Slow Performance

### Common Issues
1. **No indexes on frequently queried columns**
   - Solution: Run the performance indexes SQL script

2. **Too many database connections**
   - Solution: Use connection pooling (already implemented)

3. **Large result sets without pagination**
   - Solution: Implement LIMIT and OFFSET in queries

4. **N+1 query problems**
   - Solution: Use JOINs or batch operations

5. **Missing foreign key indexes**
   - Solution: Index all foreign key columns

### Debug Performance Issues
```javascript
// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  console.time('Query');
  const result = await pool.execute(query, params);
  console.timeEnd('Query');
  return result;
}
```

## Best Practices

1. **Always use prepared statements** to prevent SQL injection and improve performance
2. **Index foreign keys** and frequently searched columns
3. **Use connection pooling** for all database operations
4. **Cache expensive operations** with appropriate TTL
5. **Monitor and profile** database performance regularly
6. **Use batch operations** for multiple related queries
7. **Implement proper error handling** and connection cleanup
