import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database-config'
import { RowDataPacket } from 'mysql2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username') || 'heang'
    const host = searchParams.get('host') || '%'
    
    // Get MySQL grants
    const [grants] = await pool.execute<RowDataPacket[]>(`SHOW GRANTS FOR '${username}'@'${host}'`)
    
    // Get scoped role assignments
    const [userRoles] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        dur.user_role_id,
        r.name as role_name,
        dur.scope_type,
        dur.target_database,
        dur.target_table,
        dur.assigned_at
      FROM DatabaseUserRoles dur 
      JOIN Roles r ON dur.role_id = r.role_id 
      JOIN DatabaseUsers du ON dur.db_user_id = du.db_user_id
      WHERE du.username = ? AND dur.is_active = TRUE
    `, [username])
    
    // Get role privileges for each role
    const rolePrivileges = []
    for (const role of userRoles) {
      const [privs] = await pool.execute<RowDataPacket[]>(`
        SELECT p.name, p.mysql_privilege, p.privilege_type
        FROM Privileges p
        JOIN RolePrivileges rp ON p.privilege_id = rp.privilege_id
        WHERE rp.role_id = (SELECT role_id FROM Roles WHERE name = ?)
      `, [role.role_name])
      
      rolePrivileges.push({
        role_name: role.role_name,
        privileges: privs
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        username: `${username}@${host}`,
        mysql_grants: grants.map((grant) => Object.values(grant)[0]),
        scoped_roles: userRoles,
        role_privileges: rolePrivileges
      }
    })
    
  } catch (error) {
    console.error('Error checking user privileges:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check privileges'
    }, { status: 500 })
  }
}
