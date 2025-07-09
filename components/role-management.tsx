"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, Shield } from "lucide-react"
import { db, Role, Privilege } from "@/lib/db"
import { auth } from "@/lib/auth"

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [privileges, setPrivileges] = useState<Privilege[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignPrivilegeOpen, setIsAssignPrivilegeOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [selectedPrivileges, setSelectedPrivileges] = useState<number[]>([])
  const [rolePrivilegesMap, setRolePrivilegesMap] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateRole = async () => {
    if (!auth.hasPrivilege("manage_roles")) {
      alert("Access denied: You do not have permission to manage roles")
      return
    }

    try {
      await db.createRole(formData)
      await loadData()
      setFormData({ name: "", description: "" })
      setIsCreateOpen(false)
    } catch (error) {
      alert("Failed to create role")
    }
  }

  const handleEditRole = async () => {
    if (!auth.hasPrivilege("manage_roles")) {
      alert("Access denied: You do not have permission to manage roles")
      return
    }

    try {
      await db.updateRole(selectedRole.role_id, formData)
      await loadData()
      setIsEditOpen(false)
      setSelectedRole(null)
    } catch (error) {
      alert("Failed to update role")
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!auth.hasPrivilege("manage_roles")) {
      alert("Access denied: You do not have permission to manage roles")
      return
    }

    if (confirm("Are you sure you want to delete this role?")) {
      try {
        await db.deleteRole(roleId)
        await loadData()
      } catch (error) {
        alert("Failed to delete role")
      }
    }
  }

  const handleAssignPrivileges = async () => {
    if (!auth.hasPrivilege("manage_privileges")) {
      alert("Access denied: You do not have permission to manage privileges")
      return
    }

    try {
      await db.assignPrivilegesToRole(selectedRole.role_id, selectedPrivileges)

      setIsAssignPrivilegeOpen(false)
      setSelectedRole(null)
      setSelectedPrivileges([])
      await loadData()
    } catch (error) {
      alert("Failed to assign privileges")
    }
  }

  const loadData = async () => {
    try {
      const [rolesData, privilegesData] = await Promise.all([db.getRoles(), db.getPrivileges()])
      setRoles(rolesData)
      setPrivileges(privilegesData)

      // Load role privileges for all roles
      const privilegesMap: Record<number, any[]> = {}
      for (const role of rolesData) {
        const rolePrivileges = await db.getRolePrivileges(role.role_id)
        const rolePrivilegeIds = rolePrivileges.map((rp) => rp.privilege_id)
        privilegesMap[role.role_id] = privilegesData.filter((p) => rolePrivilegeIds.includes(p.privilege_id))
      }
      setRolePrivilegesMap(privilegesMap)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Replace the getRolePrivileges function with:
  const getRolePrivileges = (roleId: number) => {
    return rolePrivilegesMap[roleId] || []
  }

  const openEditDialog = (role: any) => {
    setSelectedRole(role)
    setFormData({ name: role.name, description: role.description })
    setIsEditOpen(true)
  }

  const openAssignPrivilegeDialog = async (role: any) => {
    setSelectedRole(role)
    try {
      const rolePrivileges = await db.getRolePrivileges(role.role_id)
      const rolePrivilegeIds = rolePrivileges.map((rp) => rp.privilege_id)
      setSelectedPrivileges(rolePrivilegeIds)
      setIsAssignPrivilegeOpen(true)
    } catch (error) {
      console.error("Failed to load role privileges:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>Manage system roles and their privileges</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>Add a new role to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter role description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRole}>Create Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Privileges</TableHead>
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
                  <div className="flex flex-wrap gap-1">
                    {getRolePrivileges(role.role_id).map((privilege) => (
                      <Badge key={privilege.privilege_id} variant="outline">
                        {privilege.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAssignPrivilegeDialog(role)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteRole(role.role_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Role Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role-description">Description</Label>
                <Textarea
                  id="edit-role-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRole}>Update Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Privileges Dialog */}
        <Dialog open={isAssignPrivilegeOpen} onOpenChange={setIsAssignPrivilegeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Privileges</DialogTitle>
              <DialogDescription>Select privileges for {selectedRole?.name} role</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {privileges.map((privilege) => (
                <div key={privilege.privilege_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`privilege-${privilege.privilege_id}`}
                    checked={selectedPrivileges.includes(privilege.privilege_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPrivileges([...selectedPrivileges, privilege.privilege_id])
                      } else {
                        setSelectedPrivileges(selectedPrivileges.filter((id) => id !== privilege.privilege_id))
                      }
                    }}
                  />
                  <Label htmlFor={`privilege-${privilege.privilege_id}`} className="flex-1">
                    <div>
                      <div className="font-medium">{privilege.name}</div>
                      <div className="text-sm text-gray-500">{privilege.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignPrivilegeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignPrivileges}>Assign Privileges</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
