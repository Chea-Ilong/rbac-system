"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, Plus, Database, Table as TableIcon, Target, Settings, Trash2 } from "lucide-react"
import { db, Role, Privilege } from '@/lib/db'

interface DiscoveredDatabase {
  database_name: string
  charset: string
  collation: string
  type: string
}

interface DiscoveredTable {
  database_name: string
  table_name: string
  table_type: string
  engine?: string
  row_count: number
  data_length: number
  created_at?: string
  comment?: string
  type: string
}

interface TargetedPrivilege {
  privilege_id: number
  target_database?: string
  target_table?: string
  privilege_name: string
  mysql_privilege: string
}

export function EnhancedRoleManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [roles, setRoles] = useState<Role[]>([])
  const [privileges, setPrivileges] = useState<Privilege[]>([])
  const [databases, setDatabases] = useState<DiscoveredDatabase[]>([])
  const [tablesByDatabase, setTablesByDatabase] = useState<Record<string, DiscoveredTable[]>>({})
  
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [isCreatePrivilegeOpen, setIsCreatePrivilegeOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    is_database_role: true
  })
  
  const [newPrivilege, setNewPrivilege] = useState({
    name: '',
    description: '',
    privilege_type: 'DATABASE' as 'DATABASE' | 'TABLE',
    target_database: '',
    target_table: '',
    mysql_privilege: 'SELECT',
    is_global: false
  })

  const MYSQL_PRIVILEGES = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'INDEX', 'GRANT', 'ALL'
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesData, privilegesData, databasesData] = await Promise.all([
        db.getRoles(),
        db.getPrivileges(),
        fetch('/api/discover/databases').then(res => res.json())
      ])
      
      setRoles(rolesData)
      setPrivileges(privilegesData)
      
      if (databasesData.success) {
        setDatabases(databasesData.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load roles and privileges')
    } finally {
      setLoading(false)
    }
  }

  const loadTablesForDatabase = async (databaseName: string) => {
    if (tablesByDatabase[databaseName]) return

    try {
      const response = await fetch(`/api/discover/databases/${encodeURIComponent(databaseName)}/tables`)
      const data = await response.json()
      
      if (data.success) {
        setTablesByDatabase(prev => ({
          ...prev,
          [databaseName]: data.data
        }))
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    }
  }

  const handleCreateRole = async () => {
    try {
      setLoading(true)
      setError('')
      
      await db.createRole(newRole)
      
      setSuccess(`Role "${newRole.name}" created successfully`)
      setNewRole({ name: '', description: '', is_database_role: true })
      setIsCreateRoleOpen(false)
      await loadData()
    } catch (error) {
      console.error('Error creating role:', error)
      setError(error instanceof Error ? error.message : 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrivilege = async () => {
    try {
      setLoading(true)
      setError('')
      
      const privilegeData = {
        name: newPrivilege.name,
        description: newPrivilege.description,
        privilege_type: newPrivilege.privilege_type,
        target_database: newPrivilege.target_database || undefined,
        target_table: newPrivilege.privilege_type === 'TABLE' ? newPrivilege.target_table : undefined,
        mysql_privilege: newPrivilege.mysql_privilege,
        is_global: newPrivilege.is_global
      }
      
      await db.createPrivilege(privilegeData)
      
      setSuccess(`Privilege "${newPrivilege.name}" created successfully`)
      setNewPrivilege({
        name: '',
        description: '',
        privilege_type: 'DATABASE',
        target_database: '',
        target_table: '',
        mysql_privilege: 'SELECT',
        is_global: false
      })
      setIsCreatePrivilegeOpen(false)
      await loadData()
    } catch (error) {
      console.error('Error creating privilege:', error)
      setError(error instanceof Error ? error.message : 'Failed to create privilege')
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enhanced Role & Privilege Management
              </CardTitle>
              <CardDescription>
                Create roles and privileges with specific database and table targeting
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Create a new role that can be assigned to users
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role-name">Name</Label>
                      <Input
                        id="role-name"
                        value={newRole.name}
                        onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Database Analyst"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-description">Description</Label>
                      <Textarea
                        id="role-description"
                        value={newRole.description}
                        onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the role's purpose..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is-database-role"
                        checked={newRole.is_database_role}
                        onCheckedChange={(checked) => 
                          setNewRole(prev => ({ ...prev, is_database_role: checked as boolean }))
                        }
                      />
                      <Label htmlFor="is-database-role">Database-level role</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRole} disabled={!newRole.name || loading}>
                      Create Role
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreatePrivilegeOpen} onOpenChange={setIsCreatePrivilegeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    New Privilege
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Targeted Privilege</DialogTitle>
                    <DialogDescription>
                      Create a privilege that targets specific databases or tables
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="privilege-name">Name</Label>
                        <Input
                          id="privilege-name"
                          value={newPrivilege.name}
                          onChange={(e) => setNewPrivilege(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., PHSAR_USERS_SELECT"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mysql-privilege">MySQL Privilege</Label>
                        <Select 
                          value={newPrivilege.mysql_privilege} 
                          onValueChange={(value) => setNewPrivilege(prev => ({ ...prev, mysql_privilege: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MYSQL_PRIVILEGES.map((priv) => (
                              <SelectItem key={priv} value={priv}>
                                {priv}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="privilege-description">Description</Label>
                      <Textarea
                        id="privilege-description"
                        value={newPrivilege.description}
                        onChange={(e) => setNewPrivilege(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this privilege allows..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="privilege-type">Privilege Level</Label>
                        <Select 
                          value={newPrivilege.privilege_type} 
                          onValueChange={(value: 'DATABASE' | 'TABLE') => {
                            setNewPrivilege(prev => ({ 
                              ...prev, 
                              privilege_type: value,
                              target_table: value === 'DATABASE' ? '' : prev.target_table
                            }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DATABASE">Database Level</SelectItem>
                            <SelectItem value="TABLE">Table Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="is-global"
                          checked={newPrivilege.is_global}
                          onCheckedChange={(checked) => 
                            setNewPrivilege(prev => ({ ...prev, is_global: checked as boolean }))
                          }
                        />
                        <Label htmlFor="is-global">Global privilege (all databases)</Label>
                      </div>
                    </div>

                    {!newPrivilege.is_global && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="target-database">Target Database</Label>
                          <Select 
                            value={newPrivilege.target_database} 
                            onValueChange={(value) => {
                              setNewPrivilege(prev => ({ ...prev, target_database: value, target_table: '' }))
                              if (value) loadTablesForDatabase(value)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select database" />
                            </SelectTrigger>
                            <SelectContent>
                              {databases.map((db) => (
                                <SelectItem key={db.database_name} value={db.database_name}>
                                  <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    {db.database_name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {newPrivilege.privilege_type === 'TABLE' && newPrivilege.target_database && (
                          <div>
                            <Label htmlFor="target-table">Target Table</Label>
                            <Select 
                              value={newPrivilege.target_table} 
                              onValueChange={(value) => setNewPrivilege(prev => ({ ...prev, target_table: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select table" />
                              </SelectTrigger>
                              <SelectContent>
                                {(tablesByDatabase[newPrivilege.target_database] || []).map((table) => (
                                  <SelectItem key={table.table_name} value={table.table_name}>
                                    <div className="flex items-center gap-2">
                                      <TableIcon className="h-4 w-4" />
                                      {table.table_name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatePrivilegeOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePrivilege} disabled={!newPrivilege.name || loading}>
                      Create Privilege
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
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

          <Tabs defaultValue="roles" className="space-y-4">
            <TabsList>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="privileges">Privileges</TabsTrigger>
            </TabsList>

            <TabsContent value="roles">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.role_id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Badge variant={role.is_database_role ? "default" : "secondary"}>
                          {role.is_database_role ? "Database" : "Application"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRole(role)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="privileges">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>MySQL Privilege</TableHead>
                    <TableHead>Scope</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privileges.map((privilege) => (
                    <TableRow key={privilege.privilege_id}>
                      <TableCell className="font-medium">{privilege.name}</TableCell>
                      <TableCell>{privilege.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{privilege.privilege_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {privilege.is_global ? (
                          <Badge variant="secondary">Global</Badge>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            {privilege.target_database && (
                              <>
                                <Database className="h-3 w-3" />
                                <span>{privilege.target_database}</span>
                              </>
                            )}
                            {privilege.target_table && (
                              <>
                                <span>.</span>
                                <TableIcon className="h-3 w-3" />
                                <span>{privilege.target_table}</span>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge>{privilege.mysql_privilege}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={privilege.is_global ? "default" : "outline"}>
                          {privilege.is_global ? "Global" : "Targeted"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
