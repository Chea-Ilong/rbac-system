"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Upload, 
  Database, 
  Table as TableIcon, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Eye,
  Archive,
  FileText,
  Calendar
} from "lucide-react"

interface BackupItem {
  id: string
  name: string
  description?: string
  type: 'full' | 'schema-only' | 'data-only' | 'selective'
  created_at: string
  size: string
  databases: string[]
  tables?: string[]
  status: 'completed' | 'in-progress' | 'failed'
  file_path?: string
}

interface DatabaseInfo {
  name: string
  tables: TableInfo[]
  size: string
}

interface TableInfo {
  name: string
  rows: number
  size: string
  engine: string
}

export function DatabaseBackupRecovery() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState(0)
  
  // Data states
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])
  const [backups, setBackups] = useState<BackupItem[]>([])
  
  // Backup form states
  const [backupType, setBackupType] = useState<'full' | 'schema-only' | 'data-only' | 'selective'>('full')
  const [backupName, setBackupName] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<Record<string, string[]>>({})
  const [includeData, setIncludeData] = useState(true)
  const [includeSchema, setIncludeSchema] = useState(true)
  const [compressionEnabled, setCompressionEnabled] = useState(true)
  
  // Recovery states
  const [selectedBackup, setSelectedBackup] = useState<string>('')
  const [recoveryType, setRecoveryType] = useState<'full' | 'selective'>('full')
  const [targetDatabase, setTargetDatabase] = useState('')
  const [overwriteExisting, setOverwriteExisting] = useState(false)

  useEffect(() => {
    loadDatabases()
    loadBackups()
  }, [])

  const loadDatabases = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/backup/databases')
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }
      setDatabases(data.data)
    } catch (error) {
      console.error('Error loading databases:', error)
      setError('Failed to load database information')
    } finally {
      setLoading(false)
    }
  }

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backup/list')
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }
      setBackups(data.data)
    } catch (error) {
      console.error('Error loading backups:', error)
      setError('Failed to load backup list')
    }
  }

  const handleCreateBackup = async () => {
    try {
      setLoading(true)
      setProgress(0)
      setError('')
      setSuccess('')

      const backupConfig = {
        name: backupName || `backup_${new Date().toISOString().slice(0, 10)}`,
        description: backupDescription,
        type: backupType,
        databases: selectedDatabases,
        tables: selectedTables,
        includeData,
        includeSchema,
        compression: compressionEnabled
      }

      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupConfig)
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Start polling for progress
      const backupId = data.backupId
      pollBackupProgress(backupId)

    } catch (error) {
      console.error('Error creating backup:', error)
      setError(error instanceof Error ? error.message : 'Failed to create backup')
      setLoading(false)
    }
  }

  const pollBackupProgress = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/progress/${backupId}`)
      const data = await response.json()
      
      if (data.success) {
        setProgress(data.progress)
        
        if (data.status === 'completed') {
          setLoading(false)
          setSuccess('Backup completed successfully!')
          setProgress(100)
          loadBackups() // Refresh backup list
          resetBackupForm()
        } else if (data.status === 'failed') {
          setLoading(false)
          setError('Backup failed: ' + data.error)
          setProgress(0)
        } else {
          // Continue polling
          setTimeout(() => pollBackupProgress(backupId), 2000)
        }
      }
    } catch (error) {
      console.error('Error polling backup progress:', error)
      setLoading(false)
      setError('Failed to monitor backup progress')
    }
  }

  const handleRestore = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const restoreConfig = {
        backupId: selectedBackup,
        type: recoveryType,
        targetDatabase,
        overwriteExisting
      }

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreConfig)
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      setSuccess('Database restored successfully!')
      loadDatabases() // Refresh database list
      
    } catch (error) {
      console.error('Error restoring backup:', error)
      setError(error instanceof Error ? error.message : 'Failed to restore backup')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/backup/delete/${backupId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      setSuccess('Backup deleted successfully!')
      loadBackups()
    } catch (error) {
      console.error('Error deleting backup:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete backup')
    }
  }

  const handleDownloadBackup = async (backupId: string, backupName: string) => {
    try {
      const response = await fetch(`/api/backup/download/${backupId}`)
      if (!response.ok) {
        throw new Error('Failed to download backup')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${backupName}.sql${compressionEnabled ? '.gz' : ''}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading backup:', error)
      setError('Failed to download backup')
    }
  }

  const resetBackupForm = () => {
    setBackupName('')
    setBackupDescription('')
    setSelectedDatabases([])
    setSelectedTables({})
    setBackupType('full')
  }

  const handleDatabaseSelection = (database: string, checked: boolean) => {
    if (checked) {
      setSelectedDatabases([...selectedDatabases, database])
    } else {
      setSelectedDatabases(selectedDatabases.filter(db => db !== database))
      // Remove tables for this database
      const newSelectedTables = { ...selectedTables }
      delete newSelectedTables[database]
      setSelectedTables(newSelectedTables)
    }
  }

  const handleTableSelection = (database: string, table: string, checked: boolean) => {
    const currentTables = selectedTables[database] || []
    if (checked) {
      setSelectedTables({
        ...selectedTables,
        [database]: [...currentTables, table]
      })
    } else {
      setSelectedTables({
        ...selectedTables,
        [database]: currentTables.filter(t => t !== table)
      })
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Database Backup & Recovery</h2>
        <Button onClick={loadDatabases} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="backup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backup">Create Backup</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
          <TabsTrigger value="manage">Manage Backups</TabsTrigger>
        </TabsList>

        {/* Create Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Create Database Backup
              </CardTitle>
              <CardDescription>
                Create a backup of your database with various options for what to include
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Backup Name</Label>
                  <Input
                    id="backup-name"
                    placeholder="Enter backup name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-type">Backup Type</Label>
                  <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Backup (Schema + Data)</SelectItem>
                      <SelectItem value="schema-only">Schema Only</SelectItem>
                      <SelectItem value="data-only">Data Only</SelectItem>
                      <SelectItem value="selective">Selective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-description">Description (Optional)</Label>
                <Textarea
                  id="backup-description"
                  placeholder="Enter backup description"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-schema"
                    checked={includeSchema}
                    onCheckedChange={(checked) => setIncludeSchema(checked as boolean)}
                    disabled={backupType === 'schema-only' || backupType === 'full'}
                  />
                  <Label htmlFor="include-schema">Include Schema</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-data"
                    checked={includeData}
                    onCheckedChange={(checked) => setIncludeData(checked as boolean)}
                    disabled={backupType === 'data-only' || backupType === 'full'}
                  />
                  <Label htmlFor="include-data">Include Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compression"
                    checked={compressionEnabled}
                    onCheckedChange={(checked) => setCompressionEnabled(checked as boolean)}
                  />
                  <Label htmlFor="compression">Enable Compression</Label>
                </div>
              </div>

              {/* Database Selection */}
              <div className="space-y-4">
                <Label>Select Databases to Backup</Label>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {databases.map((database) => (
                    <div key={database.name} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`db-${database.name}`}
                          checked={selectedDatabases.includes(database.name)}
                          onCheckedChange={(checked) => 
                            handleDatabaseSelection(database.name, checked as boolean)
                          }
                        />
                        <Database className="w-4 h-4" />
                        <Label htmlFor={`db-${database.name}`} className="flex-1">
                          {database.name}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {database.size}
                        </Badge>
                      </div>

                      {/* Table Selection for Selective Backup */}
                      {backupType === 'selective' && selectedDatabases.includes(database.name) && (
                        <div className="ml-6 space-y-1">
                          {database.tables.map((table) => (
                            <div key={table.name} className="flex items-center space-x-2">
                              <Checkbox
                                id={`table-${database.name}-${table.name}`}
                                checked={(selectedTables[database.name] || []).includes(table.name)}
                                onCheckedChange={(checked) =>
                                  handleTableSelection(database.name, table.name, checked as boolean)
                                }
                              />
                              <TableIcon className="w-3 h-3" />
                              <Label 
                                htmlFor={`table-${database.name}-${table.name}`}
                                className="text-sm flex-1"
                              >
                                {table.name}
                              </Label>
                              <Badge variant="outline" className="text-xs">
                                {table.rows} rows
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Backup Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Action Button */}
              <Button 
                onClick={handleCreateBackup} 
                className="w-full" 
                disabled={loading || selectedDatabases.length === 0}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restore Tab */}
        <TabsContent value="restore" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Restore Database
              </CardTitle>
              <CardDescription>
                Restore your database from a previous backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-select">Select Backup</Label>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a backup to restore" />
                    </SelectTrigger>
                    <SelectContent>
                      {backups
                        .filter(backup => backup.status === 'completed')
                        .map((backup) => (
                        <SelectItem key={backup.id} value={backup.id}>
                          {backup.name} - {new Date(backup.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recovery-type">Recovery Type</Label>
                  <Select value={recoveryType} onValueChange={(value: any) => setRecoveryType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Restore</SelectItem>
                      <SelectItem value="selective">Selective Restore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-db">Target Database (Optional)</Label>
                <Input
                  id="target-db"
                  placeholder="Leave empty to restore to original location"
                  value={targetDatabase}
                  onChange={(e) => setTargetDatabase(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                />
                <Label htmlFor="overwrite">Overwrite existing data</Label>
              </div>

              <Button 
                onClick={handleRestore} 
                className="w-full" 
                disabled={loading || !selectedBackup}
                variant="destructive"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Restore Database
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Backups Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Backup Management
              </CardTitle>
              <CardDescription>
                View, download, and manage your database backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Databases</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          {backup.description && (
                            <div className="text-sm text-gray-500">{backup.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(backup.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={backup.status === 'completed' ? 'default' : 
                                  backup.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {backup.databases.map((db) => (
                            <Badge key={db} variant="outline" className="text-xs">
                              {db}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.id, backup.name)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {backups.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No backups found. Create your first backup to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
