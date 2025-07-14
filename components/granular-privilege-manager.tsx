"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Database, Table as TableIcon, Shield, Globe, Server } from "lucide-react"
import { db, DatabaseUser, DatabaseObject, UserEffectivePrivileges, UserSpecificPrivilege, Role, ScopedRoleAssignment, DiscoveredDatabase, DiscoveredTable } from '@/lib/db'

interface GranularPrivilegeManagerProps {
  user: DatabaseUser
  onPrivilegesChange?: () => void
}

const MYSQL_PRIVILEGES = [
  'SELECT',
  'INSERT', 
  'UPDATE',
  'DELETE',
  'CREATE',
  'DROP',
  'ALTER',
  'INDEX',
  'GRANT'
]

export function GranularPrivilegeManager({ user, onPrivilegesChange }: GranularPrivilegeManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [discoveredDatabases, setDiscoveredDatabases] = useState<DiscoveredDatabase[]>([])
  const [discoveredTables, setDiscoveredTables] = useState<DiscoveredTable[]>([])
  const [databases, setDatabases] = useState<DatabaseObject[]>([])
  const [tables, setTables] = useState<DatabaseObject[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedPrivilege, setSelectedPrivilege] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedScopeType, setSelectedScopeType] = useState<'GLOBAL' | 'DATABASE' | 'TABLE'>('GLOBAL')
  const [isTableLevel, setIsTableLevel] = useState(false)
  
  const [userPrivileges, setUserPrivileges] = useState<UserEffectivePrivileges>({
    rolePrivileges: [],
    directPrivileges: []
  })
  const [userScopedRoles, setUserScopedRoles] = useState<ScopedRoleAssignment[]>([])

  // Load initial data
  useEffect(() => {
    loadDiscoveredDatabases()
    loadDatabases()
    loadRoles()
    loadUserPrivileges()
    loadUserScopedRoles()
  }, [user.db_user_id])

  // Load tables when database changes
  useEffect(() => {
    if (selectedDatabase) {
      loadTablesForDatabase(selectedDatabase)
      loadDiscoveredTablesForDatabase(selectedDatabase)
    } else {
      setTables([])
      setDiscoveredTables([])
      setSelectedTable('')
    }
  }, [selectedDatabase])

  const loadDiscoveredDatabases = async () => {
    try {
      const data = await db.getDiscoveredDatabases()
      setDiscoveredDatabases(data)
    } catch (error) {
      console.error('Error loading discovered databases:', error)
      setError('Failed to load discovered databases')
    }
  }

  const loadDiscoveredTablesForDatabase = async (databaseName: string) => {
    try {
      const data = await db.getDiscoveredTablesForDatabase(databaseName)
      setDiscoveredTables(data)
    } catch (error) {
      console.error('Error loading discovered tables:', error)
      setError('Failed to load discovered tables for database')
    }
  }

  const loadDatabases = async () => {
    try {
      const data = await db.getDatabases()
      setDatabases(data)
    } catch (error) {
      console.error('Error loading databases:', error)
      setError('Failed to load databases')
    }
  }

  const loadTablesForDatabase = async (databaseName: string) => {
    try {
      const data = await db.getTablesForDatabase(databaseName)
      setTables(data)
    } catch (error) {
      console.error('Error loading tables:', error)
      setError('Failed to load tables for database')
    }
  }

  const loadRoles = async () => {
    try {
      const data = await db.getRoles()
      setRoles(data)
    } catch (error) {
      console.error('Error loading roles:', error)
      setError('Failed to load roles')
    }
  }

  const loadUserScopedRoles = async () => {
    try {
      const data = await db.getUserScopedRoles(user.db_user_id)
      setUserScopedRoles(data)
    } catch (error) {
      console.error('Error loading user scoped roles:', error)
      setError('Failed to load user scoped roles')
    }
  }

  const loadUserPrivileges = async () => {
    try {
      setLoading(true)
      const data = await db.getUserEffectivePrivileges(user.db_user_id)
      setUserPrivileges(data)
    } catch (error) {
      console.error('Error loading user privileges:', error)
      setError('Failed to load user privileges')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignScopedRole = async () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    if (selectedScopeType === 'DATABASE' && !selectedDatabase) {
      setError('Please select a database for database-level role assignment')
      return
    }

    if (selectedScopeType === 'TABLE' && (!selectedDatabase || !selectedTable)) {
      setError('Please select both database and table for table-level role assignment')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await db.assignScopedRoleToUser({
        dbUserId: user.db_user_id,
        roleId: parseInt(selectedRole),
        scopeType: selectedScopeType,
        targetDatabase: selectedScopeType !== 'GLOBAL' ? selectedDatabase : undefined,
        targetTable: selectedScopeType === 'TABLE' ? selectedTable : undefined,
        assignedBy: 'admin'
      })

      const scopeDescription = selectedScopeType === 'GLOBAL' 
        ? 'global scope' 
        : selectedScopeType === 'DATABASE' 
          ? `database scope (${selectedDatabase})`
          : `table scope (${selectedDatabase}.${selectedTable})`

      setSuccess(`Successfully assigned role with ${scopeDescription}`)
      
      // Reset form
      setSelectedDatabase('')
      setSelectedTable('')
      setSelectedRole('')
      setSelectedScopeType('GLOBAL')
      
      // Reload data
      await loadUserPrivileges()
      await loadUserScopedRoles()
      
      if (onPrivilegesChange) {
        onPrivilegesChange()
      }
    } catch (error) {
      console.error('Error assigning scoped role:', error)
      setError(error instanceof Error ? error.message : 'Failed to assign scoped role')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeScopedRole = async (assignment: ScopedRoleAssignment) => {
    try {
      setLoading(true)
      setError('')
      
      await db.revokeScopedRoleFromUser(user.db_user_id, assignment.user_role_id)
      
      setSuccess(`Successfully revoked ${assignment.role_name} from ${assignment.target_database}${assignment.target_table ? `.${assignment.target_table}` : ''}`)
      
      // Reload data
      await loadUserPrivileges()
      await loadUserScopedRoles()
      
      if (onPrivilegesChange) {
        onPrivilegesChange()
      }
    } catch (error) {
      console.error('Error revoking scoped role:', error)
      setError(error instanceof Error ? error.message : 'Failed to revoke scoped role')
    } finally {
      setLoading(false)
    }
  }

  const handleGrantPrivilege = async () => {
    if (!selectedDatabase || !selectedPrivilege) {
      setError('Please select a database and privilege')
      return
    }

    if (isTableLevel && !selectedTable) {
      setError('Please select a table for table-level privileges')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await db.grantUserSpecificPrivilege({
        userId: user.db_user_id,
        privilegeType: selectedPrivilege,
        targetDatabase: selectedDatabase,
        targetTable: isTableLevel ? selectedTable : undefined,
        grantedBy: 'admin'
      })

      setSuccess(`Successfully granted ${selectedPrivilege} privilege on ${selectedDatabase}${isTableLevel ? `.${selectedTable}` : ''}`)
      
      // Reset form
      setSelectedDatabase('')
      setSelectedTable('')
      setSelectedPrivilege('')
      setIsTableLevel(false)
      
      // Reload privileges
      await loadUserPrivileges()
      
      if (onPrivilegesChange) {
        onPrivilegesChange()
      }
    } catch (error) {
      console.error('Error granting privilege:', error)
      setError(error instanceof Error ? error.message : 'Failed to grant privilege')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokePrivilege = async (privilege: UserSpecificPrivilege) => {
    try {
      setLoading(true)
      setError('')
      
      await db.revokeUserSpecificPrivilege(user.db_user_id, privilege.user_privilege_id)
      
      setSuccess(`Successfully revoked ${privilege.privilege_type} privilege from ${privilege.target_database}${privilege.target_table ? `.${privilege.target_table}` : ''}`)
      
      // Reload privileges
      await loadUserPrivileges()
      
      if (onPrivilegesChange) {
        onPrivilegesChange()
      }
    } catch (error) {
      console.error('Error revoking privilege:', error)
      setError(error instanceof Error ? error.message : 'Failed to revoke privilege')
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Scoped Role & Privilege Management for {user.username}
          </CardTitle>
          <CardDescription>
            Assign roles with specific database/table scope or grant direct privileges to this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="role-assignment" className="space-y-4">
            <TabsList>
              <TabsTrigger value="role-assignment">Assign Scoped Role</TabsTrigger>
              <TabsTrigger value="direct-privilege">Grant Direct Privilege</TabsTrigger>
              <TabsTrigger value="view">View Current Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="role-assignment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select 
                    value={selectedRole} 
                    onValueChange={(value) => {
                      setSelectedRole(value)
                      clearMessages()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.role_id} value={role.role_id.toString()}>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {role.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Scope Level</label>
                  <Select 
                    value={selectedScopeType} 
                    onValueChange={(value: 'GLOBAL' | 'DATABASE' | 'TABLE') => {
                      setSelectedScopeType(value)
                      setSelectedDatabase('')
                      setSelectedTable('')
                      clearMessages()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GLOBAL">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Global (All Databases)
                        </div>
                      </SelectItem>
                      <SelectItem value="DATABASE">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Database Level
                        </div>
                      </SelectItem>
                      <SelectItem value="TABLE">
                        <div className="flex items-center gap-2">
                          <TableIcon className="h-4 w-4" />
                          Table Level
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedScopeType === 'DATABASE' || selectedScopeType === 'TABLE') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Database</label>
                    <Select 
                      value={selectedDatabase} 
                      onValueChange={(value) => {
                        setSelectedDatabase(value)
                        setSelectedTable('')
                        clearMessages()
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select database" />
                      </SelectTrigger>
                      <SelectContent>
                        {discoveredDatabases.map((db) => (
                          <SelectItem key={db.database_name} value={db.database_name}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              {db.database_name}
                              <Badge variant="outline" className="text-xs">{db.charset}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedScopeType === 'TABLE' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Table</label>
                    <Select 
                      value={selectedTable} 
                      onValueChange={(value) => {
                        setSelectedTable(value)
                        clearMessages()
                      }}
                      disabled={!selectedDatabase}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {discoveredTables.map((table) => (
                          <SelectItem key={table.table_name} value={table.table_name}>
                            <div className="flex items-center gap-2">
                              <TableIcon className="h-4 w-4" />
                              {table.table_name}
                              <Badge variant="secondary" className="text-xs">{table.table_type}</Badge>
                              {table.engine && (
                                <Badge variant="outline" className="text-xs">{table.engine}</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleAssignScopedRole} 
                disabled={loading || !selectedRole || (selectedScopeType !== 'GLOBAL' && !selectedDatabase) || (selectedScopeType === 'TABLE' && !selectedTable)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Role with Scope
              </Button>
            </TabsContent>

            <TabsContent value="direct-privilege" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Database</label>
                  <Select 
                    value={selectedDatabase} 
                    onValueChange={(value) => {
                      setSelectedDatabase(value)
                      clearMessages()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem key={db.object_id} value={db.database_name}>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {db.database_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Privilege Level</label>
                  <Select 
                    value={isTableLevel ? 'table' : 'database'} 
                    onValueChange={(value) => {
                      setIsTableLevel(value === 'table')
                      setSelectedTable('')
                      clearMessages()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database Level</SelectItem>
                      <SelectItem value="table">Table Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isTableLevel && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Table</label>
                    <Select 
                      value={selectedTable} 
                      onValueChange={(value) => {
                        setSelectedTable(value)
                        clearMessages()
                      }}
                      disabled={!selectedDatabase}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.object_id} value={table.table_name!}>
                            <div className="flex items-center gap-2">
                              <Table className="h-4 w-4" />
                              {table.table_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Privilege Type</label>
                  <Select 
                    value={selectedPrivilege} 
                    onValueChange={(value) => {
                      setSelectedPrivilege(value)
                      clearMessages()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select privilege" />
                    </SelectTrigger>
                    <SelectContent>
                      {MYSQL_PRIVILEGES.map((privilege) => (
                        <SelectItem key={privilege} value={privilege}>
                          {privilege}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGrantPrivilege} 
                disabled={loading || !selectedDatabase || !selectedPrivilege || (isTableLevel && !selectedTable)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Grant Direct Privilege
              </Button>
            </TabsContent>

            <TabsContent value="view" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-6">
                  {/* Scoped Role Assignments */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Scoped Role Assignments</h3>
                    {userScopedRoles.length === 0 ? (
                      <p className="text-gray-500">No scoped roles assigned</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Scope Type</TableHead>
                            <TableHead>Target Database</TableHead>
                            <TableHead>Target Table</TableHead>
                            <TableHead>Assigned Date</TableHead>
                            <TableHead>Assigned By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userScopedRoles.map((assignment) => (
                            <TableRow key={assignment.user_role_id}>
                              <TableCell>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  {assignment.role_name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={assignment.scope_type === 'GLOBAL' ? 'default' : assignment.scope_type === 'DATABASE' ? 'secondary' : 'outline'}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {assignment.scope_type === 'GLOBAL' && <Globe className="h-3 w-3" />}
                                  {assignment.scope_type === 'DATABASE' && <Database className="h-3 w-3" />}
                                  {assignment.scope_type === 'TABLE' && <TableIcon className="h-3 w-3" />}
                                  {assignment.scope_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {assignment.target_database ? (
                                  <div className="flex items-center gap-1">
                                    <Database className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{assignment.target_database}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">All databases</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {assignment.target_table ? (
                                  <div className="flex items-center gap-1">
                                    <TableIcon className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{assignment.target_table}</span>
                                  </div>
                                ) : assignment.scope_type === 'TABLE' ? (
                                  <span className="text-gray-400 italic">No table</span>
                                ) : (
                                  <span className="text-gray-400 italic">All tables</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {assignment.assigned_by}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRevokeScopedRole(assignment)}
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Direct Privileges */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Direct Privileges</h3>
                    {userPrivileges.directPrivileges.length === 0 ? (
                      <p className="text-gray-500">No direct privileges assigned</p>
                    ) : (
                      <div className="grid gap-2">
                        {userPrivileges.directPrivileges.map((privilege) => (
                          <div 
                            key={privilege.user_privilege_id} 
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">
                                {privilege.privilege_type}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm">
                                <Database className="h-4 w-4" />
                                <span className="font-medium">{privilege.target_database}</span>
                                {privilege.target_table && (
                                  <>
                                    <span>.</span>
                                    <Table className="h-4 w-4" />
                                    <span className="font-medium">{privilege.target_table}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevokePrivilege(privilege)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
