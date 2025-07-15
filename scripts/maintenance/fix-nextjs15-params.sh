#!/bin/bash

# Fix Next.js 15 dynamic route parameters - they need to be awaited
# This script updates all API routes to use the new Promise-based params

echo "🔧 Fixing Next.js 15 dynamic route parameters..."

# Find all API route files that use params
find "/home/long/Desktop/rbac-system (5) (Copy)/app/api" -name "route.ts" -type f | while read file; do
    echo "Checking: $file"
    
    # Check if file contains params pattern
    if grep -q "params.*{.*}" "$file"; then
        echo "  ✏️  Updating: $file"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Fix single parameter routes
        sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
        sed -i 's/{ params }: { params: { database: string } }/{ params }: { params: Promise<{ database: string }> }/g' "$file"
        sed -i 's/{ params }: { params: { privilegeId: string } }/{ params }: { params: Promise<{ privilegeId: string }> }/g' "$file"
        sed -i 's/{ params }: { params: { roleId: string } }/{ params }: { params: Promise<{ roleId: string }> }/g' "$file"
        
        # Fix dual parameter routes
        sed -i 's/{ params }: { params: { id: string; privilegeId: string } }/{ params }: { params: Promise<{ id: string; privilegeId: string }> }/g' "$file"
        sed -i 's/{ params }: { params: { id: string; roleId: string } }/{ params }: { params: Promise<{ id: string; roleId: string }> }/g' "$file"
        
        echo "  ✅ Updated parameter types in: $file"
    fi
done

echo "🎉 Completed fixing parameter types. Now manually fix the parameter usage..."
