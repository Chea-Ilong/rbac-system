"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkDatabase = async () => {
    try {
      const dbUsers = await db.getDatabaseUsers()
      const roles = await db.getRoles()
      const privileges = await db.getPrivileges()

      setDebugInfo({
        database_users: dbUsers,
        roles,
        privileges,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const testCreateDatabaseUser = async () => {
    try {
      const testUser = {
        username: "test_user_" + Date.now(),
        host: '%',
        description: "Test database user created for debugging",
        password: "testpass123",
      }

      console.log("Creating test database user:", testUser)
      const result = await db.createDatabaseUser(testUser)
      console.log("Test database user created:", result)

      // Refresh debug info
      await checkDatabase()
    } catch (error) {
      console.error("Failed to create test database user:", error)
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
        <CardDescription>Database debugging and testing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={checkDatabase}>Check Database</Button>
            <Button onClick={testCreateDatabaseUser}>Test Create Database User</Button>
          </div>

          {debugInfo && (
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
