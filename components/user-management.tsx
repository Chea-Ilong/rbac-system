"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, UserPlus, RefreshCw, Database, Shield, Settings } from "lucide-react"
import { db, type DatabaseUser, type Role } from "@/lib/db"
import { auth } from "@/lib/auth"
import { GranularPrivilegeManager } from "./granular-privilege-manager"

export function UserManagement() {
  const [dbUsers, setDbUsers] = useState<DatabaseUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [userRolesMap, setUserRolesMap] = useState<Record<number, Role[]>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false)
  const [isPrivilegeManagerOpen, setIsPrivilegeManagerOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null)
  const [formData, setFormData] = useState({ username: "", host: "%", description: "", password: "" })
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError("")
      const [usersData, rolesData] = await Promise.all([db.getDatabaseUsers(), db.getRoles()])
      setDbUsers(usersData)
      setRoles(rolesData)

      // Load user roles for all database users
      const rolesMap: Record<number, Role[]> = {}
      for (const user of usersData) {
        const userRoles = await db.getDatabaseUserRoles(user.db_user_id)
        rolesMap[user.db_user_id] = userRoles
      }
      setUserRolesMap(rolesMap)
    } catch (error) {
      console.error("Failed to load data:", error)
      setError("Failed to load data from database")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    // Validate form data
    if (!formData.username.trim()) {
      setError("Please fill in username")
      return
    }

    if (!auth.hasPrivilege("manage_users")) {
      setError("Access denied: You do not have permission to manage users")
      return
    }

    setCreating(true)
    setError("")

    try {
      // Use database user creation method
      const newUser = await db.createDatabaseUser({
        username: formData.username.trim(),
        host: formData.host.trim() || '%',
        description: formData.description.trim(),
        password: formData.password.trim() || undefined
      })

      console.log("✅ Database user created successfully:", newUser)
      await loadData() // Reload data
      setFormData({ username: "", host: "%", description: "", password: "" })
      setIsCreateOpen(false)
      setError("")
    } catch (error) {
      console.error("❌ Failed to create database user:", error)
      setError(error instanceof Error ? error.message : "Failed to create database user")
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = async () => {
    if (!auth.hasPrivilege("manage_users")) {
      setError("Access denied: You do not have permission to manage users")
      return
    }

    if (!selectedUser) return

    try {
      await db.updateDatabaseUser(selectedUser.db_user_id, {
        username: formData.username,
        host: formData.host,
        description: formData.description
      })
      await loadData() // Reload data
      setIsEditOpen(false)
      setSelectedUser(null)
      setError("")
    } catch (error) {
      setError("Failed to update database user")
    }
  }

  const handleDeleteUser = async (dbUserId: number) => {
    if (!auth.hasPrivilege("manage_users")) {
      setError("Access denied: You do not have permission to manage users")
      return
    }

    if (confirm("Are you sure you want to delete this database user?")) {
      try {
        await db.deleteDatabaseUser(dbUserId)
        await loadData() // Reload data
        setError("")
      } catch (error) {
        setError("Failed to delete database user")
      }
    }
  }

  const handleAssignRoles = async () => {
    if (!auth.hasPrivilege("assign_roles")) {
      setError("Access denied: You do not have permission to assign roles")
      return
    }

    if (!selectedUser) return

    try {
      await db.assignRolesToDatabaseUser(selectedUser.db_user_id, selectedRoles)

      setIsAssignRoleOpen(false)
      setSelectedUser(null)
      setSelectedRoles([])
      await loadData() // Reload data
      setError("")
    } catch (error) {
      setError("Failed to assign roles")
      console.error("Failed to assign roles:", error)
    }
  }

  const handleApplyPrivileges = async (dbUserId: number) => {
    if (!auth.hasPrivilege("manage_users")) {
      setError("Access denied: You do not have permission to apply privileges")
      return
    }

    try {
      await db.applyPrivilegesToDatabaseUser(dbUserId)
      setError("")
      alert("Privileges applied successfully!")
    } catch (error) {
      setError("Failed to apply privileges")
      console.error("Failed to apply privileges:", error)
    }
  }

  const getUserRoles = (dbUserId: number) => {
    const roles = userRolesMap[dbUserId] || []
    // Deduplicate roles by role_id to avoid duplicate keys
    const uniqueRoles = roles.filter((role, index, self) => 
      self.findIndex(r => r.role_id === role.role_id) === index
    )
    return uniqueRoles
  }

  const openEditDialog = (user: DatabaseUser) => {
    setSelectedUser(user)
    setFormData({ 
      username: user.username, 
      host: user.host, 
      description: user.description || "", 
      password: "" 
    })
    setIsEditOpen(true)
  }

  const openAssignRoleDialog = async (user: DatabaseUser) => {
    setSelectedUser(user)
    try {
      const userRoles = await db.getDatabaseUserRoles(user.db_user_id)
      const userRoleIds = userRoles.map((role) => role.role_id)
      setSelectedRoles(userRoleIds)
      setIsAssignRoleOpen(true)
    } catch (error) {
      console.error("Failed to load user roles:", error)
    }
  }

  const openPrivilegeManagerDialog = (user: DatabaseUser) => {
    setSelectedUser(user)
    setIsPrivilegeManagerOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading users...
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database User Management
            </CardTitle>
            <CardDescription>Manage database users and their privileges</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Database User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Database User</DialogTitle>
                  <DialogDescription>Add a new database user to the system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
                  )}
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter database username"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="Enter host (default: %)"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description (optional)"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      disabled={creating}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={creating}>
                    {creating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbUsers.map((user) => (
              <TableRow key={user.db_user_id}>
                <TableCell className="font-mono text-sm">{user.db_user_id}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.host}</TableCell>
                <TableCell>{user.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getUserRoles(user.db_user_id).map((role) => (
                      <Badge key={role.role_id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAssignRoleDialog(user)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openPrivilegeManagerDialog(user)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.db_user_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleApplyPrivileges(user.db_user_id)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedUser(user)
                      setIsPrivilegeManagerOpen(true)
                    }}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {dbUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No database users found. Create your first database user to get started.</div>
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Database User</DialogTitle>
              <DialogDescription>Update database user information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-host">Host</Label>
                <Input
                  id="edit-host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>Update User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Roles Dialog */}
        <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Roles</DialogTitle>
              <DialogDescription>Select roles for {selectedUser?.username}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.role_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.role_id}`}
                    checked={selectedRoles.includes(role.role_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoles([...selectedRoles, role.role_id])
                      } else {
                        setSelectedRoles(selectedRoles.filter((id) => id !== role.role_id))
                      }
                    }}
                  />
                  <Label htmlFor={`role-${role.role_id}`} className="flex-1">
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignRoles}>Assign Roles</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Granular Privilege Manager Dialog */}
        <Dialog open={isPrivilegeManagerOpen} onOpenChange={setIsPrivilegeManagerOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Granular Privilege Management</DialogTitle>
              <DialogDescription>
                Manage specific database and table-level permissions for {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <GranularPrivilegeManager 
                user={selectedUser} 
                onPrivilegesChange={loadData}
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPrivilegeManagerOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
