"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database, Table as TableIcon, RefreshCw, Server, Eye } from "lucide-react"

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

export function DatabaseBrowser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [databases, setDatabases] = useState<DiscoveredDatabase[]>([])
  const [tablesByDatabase, setTablesByDatabase] = useState<Record<string, DiscoveredTable[]>>({})

  useEffect(() => {
    loadDatabases()
  }, [])

  const loadDatabases = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/discover/databases')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load databases')
      }
      
      setDatabases(data.data)
    } catch (error) {
      console.error('Error loading databases:', error)
      setError(error instanceof Error ? error.message : 'Failed to load databases')
    } finally {
      setLoading(false)
    }
  }

  const loadTablesForDatabase = async (databaseName: string) => {
    try {
      const response = await fetch(`/api/discover/databases/${encodeURIComponent(databaseName)}/tables`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load tables')
      }
      
      setTablesByDatabase(prev => ({
        ...prev,
        [databaseName]: data.data
      }))
    } catch (error) {
      console.error('Error loading tables:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tables')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                MariaDB Database Browser
              </CardTitle>
              <CardDescription>
                Explore all databases and tables on your MariaDB server
              </CardDescription>
            </div>
            <Button onClick={loadDatabases} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {databases.map((database) => (
              <Card key={database.database_name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {database.database_name}
                    <Badge variant="outline">{database.charset}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Collation: {database.collation}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tablesByDatabase[database.database_name] ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Engine</TableHead>
                          <TableHead>Rows</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tablesByDatabase[database.database_name].map((table) => (
                          <TableRow key={table.table_name}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <TableIcon className="h-4 w-4" />
                                {table.table_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{table.table_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {table.engine && (
                                <Badge variant="outline">{table.engine}</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatNumber(table.row_count)}</TableCell>
                            <TableCell>{formatBytes(table.data_length)}</TableCell>
                            <TableCell>
                              {table.created_at ? new Date(table.created_at).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">
                      <Button
                        variant="outline"
                        onClick={() => loadTablesForDatabase(database.database_name)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Load Tables
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
