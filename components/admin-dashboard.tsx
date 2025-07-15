"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, Key, LogOut, Archive } from "lucide-react"
import { UserManagement } from "./user-management"
import { RoleManagement } from "./role-management"
import { PrivilegeManagement } from "./privilege-management"
import { DatabaseBackupRecovery } from "./database-backup-recovery"

interface AdminDashboardProps {
  user: any
  onLogout: () => void
}

interface Stats {
  database_users: number;
  roles: number;
  privileges: number;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users")
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RBAC Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Role-Based Access Control System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <div className="flex space-x-1">
                  {user.roles.map((role: string) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.database_users ?? '-'}</div>
              <p className="text-xs text-muted-foreground">Active database users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.roles ?? '-'}</div>
              <p className="text-xs text-muted-foreground">Defined user roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Privileges</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.privileges ?? '-'}</div>
              <p className="text-xs text-muted-foreground">System privileges</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Database Users</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="privileges">Privilege Management</TabsTrigger>
            <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="privileges" className="space-y-4">
            <PrivilegeManagement />
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <DatabaseBackupRecovery />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
