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
import { Plus, Key, Users, Edit, Trash2, Shield } from "lucide-react"
import { db, Privilege, Role } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Checkbox } from "@/components/ui/checkbox"

export function PrivilegeManagement() {
  const [privileges, setPrivileges] = useState<Privilege[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false)
  const [selectedPrivilege, setSelectedPrivilege] = useState<any | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [privilegeRolesMap, setPrivilegeRolesMap] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePrivilege = async () => {
    if (!auth.hasPrivilege("manage_privileges")) {
      alert("Access denied: You do not have permission to manage privileges")
      return
    }

    try {
      await db.createPrivilege(formData)
      await loadData()
      setFormData({ name: "", description: "" })
      setIsCreateOpen(false)
    } catch (error) {
      alert("Failed to create privilege")
    }
  }

  const handleEditPrivilege = async () => {
    if (!auth.hasPrivilege("manage_privileges")) {
      alert("Access denied: You do not have permission to manage privileges")
      return
    }

    try {
      await db.updatePrivilege(selectedPrivilege.privilege_id, formData)
      await loadData()
      setIsEditOpen(false)
      setSelectedPrivilege(null)
    } catch (error) {
      alert("Failed to update privilege")
    }
  }

  const handleDeletePrivilege = async (privilegeId: number) => {
    if (!auth.hasPrivilege("manage_privileges")) {
      alert("Access denied: You do not have permission to manage privileges")
      return
    }

    if (confirm("Are you sure you want to delete this privilege?")) {
      try {
        await db.deletePrivilege(privilegeId)
        await loadData()
      } catch (error) {
        alert("Failed to delete privilege")
      }
    }
  }

  const handleAssignRoles = async () => {
    if (!selectedPrivilege) return

    if (!auth.hasPrivilege("manage_roles")) {
      alert("Access denied: You do not have permission to manage roles")
      return
    }

    try {
      await db.assignRolesToPrivilege(selectedPrivilege.privilege_id, selectedRoleIds)
      await loadData()
      setIsAssignRolesOpen(false)
      setSelectedPrivilege(null)
    } catch (error) {
      alert("Failed to update privilege roles")
    }
  }

  const loadData = async () => {
    try {
      const [privilegesData, rolesData] = await Promise.all([db.getPrivileges(), db.getRoles()])
      setPrivileges(privilegesData)
      setRoles(rolesData)

      // Load privilege roles for all privileges
      const rolesMap: Record<number, any[]> = {}
      for (const privilege of privilegesData) {
        try {
          const privilegeRoles = await db.getRolesForPrivilege(privilege.privilege_id)
          rolesMap[privilege.privilege_id] = privilegeRoles
        } catch (error) {
          console.error(`Failed to load roles for privilege ${privilege.privilege_id}:`, error)
          rolesMap[privilege.privilege_id] = []
        }
      }
      setPrivilegeRolesMap(rolesMap)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (privilege: any) => {
    setSelectedPrivilege(privilege)
    setFormData({ name: privilege.name, description: privilege.description })
    setIsEditOpen(true)
  }

  const openAssignRolesDialog = (privilege: any) => {
    setSelectedPrivilege(privilege)
    const currentRoleIds = getPrivilegeRoles(privilege.privilege_id).map((r: any) => r.role_id)
    setSelectedRoleIds(currentRoleIds)
    setIsAssignRolesOpen(true)
  }

  const getPrivilegeRoles = (privilegeId: number) => {
    return privilegeRolesMap[privilegeId] || []
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Privilege Management</CardTitle>
            <CardDescription>Manage system privileges and permissions</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Privilege
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Privilege</DialogTitle>
                <DialogDescription>Add a new privilege to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="privilege-name">Privilege Name</Label>
                  <Input
                    id="privilege-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter privilege name (e.g., manage_projects)"
                  />
                </div>
                <div>
                  <Label htmlFor="privilege-description">Description</Label>
                  <Textarea
                    id="privilege-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter privilege description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePrivilege}>Create Privilege</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Privilege Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assigned to Roles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {privileges.map((privilege) => (
              <TableRow key={privilege.privilege_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span>{privilege.name}</span>
                  </div>
                </TableCell>
                <TableCell>{privilege.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getPrivilegeRoles(privilege.privilege_id).map((role) => (
                      <Badge key={role.role_id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{new Date(privilege.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(privilege)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAssignRolesDialog(privilege)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeletePrivilege(privilege.privilege_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit Privilege Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Privilege</DialogTitle>
            <DialogDescription>Update privilege information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-privilege-name">Privilege Name</Label>
              <Input
                id="edit-privilege-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-privilege-description">Description</Label>
              <Textarea
                id="edit-privilege-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPrivilege}>Update Privilege</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={isAssignRolesOpen} onOpenChange={setIsAssignRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Roles for {selectedPrivilege?.name}</DialogTitle>
            <DialogDescription>Assign or unassign roles for this privilege.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {roles.map((role) => (
              <div key={role.role_id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.role_id}`}
                  checked={selectedRoleIds.includes(role.role_id)}
                  onCheckedChange={(checked) => {
                    setSelectedRoleIds((prev) =>
                      checked ? [...prev, role.role_id] : prev.filter((id) => id !== role.role_id)
                    )
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
            <Button variant="outline" onClick={() => setIsAssignRolesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRoles}>Assign Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
