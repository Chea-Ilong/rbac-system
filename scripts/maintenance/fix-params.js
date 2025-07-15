#!/usr/bin/env node

/**
 * Fix Next.js 15 dynamic route parameters
 * Updates all API routes to use awaited params
 */

const fs = require('fs');
const path = require('path');

const apiDir = '/home/long/Desktop/rbac-system (5) (Copy)/app/api';

function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixParamsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: Single id parameter
  const singleIdPattern = /(\w+\s*\(\s*[^,]+,\s*{\s*params\s*}:\s*{\s*params:\s*){\s*id:\s*string\s*}/g;
  if (content.match(singleIdPattern)) {
    content = content.replace(singleIdPattern, '$1Promise<{ id: string }>');
    modified = true;
    console.log(`  ✏️  Fixed single id params in: ${path.basename(filePath)}`);
  }
  
  // Pattern 2: Database parameter
  const databasePattern = /(\w+\s*\(\s*[^,]+,\s*{\s*params\s*}:\s*{\s*params:\s*){\s*database:\s*string\s*}/g;
  if (content.match(databasePattern)) {
    content = content.replace(databasePattern, '$1Promise<{ database: string }>');
    modified = true;
    console.log(`  ✏️  Fixed database params in: ${path.basename(filePath)}`);
  }
  
  // Pattern 3: Dual parameters (id + privilegeId)
  const dualPrivilegePattern = /(\w+\s*\(\s*[^,]+,\s*{\s*params\s*}:\s*{\s*params:\s*){\s*id:\s*string;\s*privilegeId:\s*string\s*}/g;
  if (content.match(dualPrivilegePattern)) {
    content = content.replace(dualPrivilegePattern, '$1Promise<{ id: string; privilegeId: string }>');
    modified = true;
    console.log(`  ✏️  Fixed dual privilege params in: ${path.basename(filePath)}`);
  }
  
  // Pattern 4: Dual parameters (id + roleId)
  const dualRolePattern = /(\w+\s*\(\s*[^,]+,\s*{\s*params\s*}:\s*{\s*params:\s*){\s*id:\s*string;\s*roleId:\s*string\s*}/g;
  if (content.match(dualRolePattern)) {
    content = content.replace(dualRolePattern, '$1Promise<{ id: string; roleId: string }>');
    modified = true;
    console.log(`  ✏️  Fixed dual role params in: ${path.basename(filePath)}`);
  }
  
  // Now fix the parameter usage patterns
  if (modified) {
    // Fix params.id usage
    content = content.replace(/const\s+(\w+)\s*=\s*Number\.parseInt\(params\.id\)/g, 
      'const { id } = await params\n    const $1 = Number.parseInt(id)');
    
    // Fix params.database usage
    content = content.replace(/const\s+(\w+)\s*=\s*params\.database/g,
      'const { database } = await params\n    const $1 = database');
    
    // Fix params.privilegeId usage
    content = content.replace(/const\s+(\w+)\s*=\s*Number\.parseInt\(params\.privilegeId\)/g,
      'const { privilegeId } = await params\n    const $1 = Number.parseInt(privilegeId)');
    
    // Fix params.roleId usage
    content = content.replace(/const\s+(\w+)\s*=\s*Number\.parseInt\(params\.roleId\)/g,
      'const { roleId } = await params\n    const $1 = Number.parseInt(roleId)');
    
    // Fix dual parameter destructuring
    content = content.replace(/const\s+(\w+)\s*=\s*Number\.parseInt\(params\.id\)\s*\n\s*const\s+(\w+)\s*=\s*Number\.parseInt\(params\.privilegeId\)/g,
      'const { id, privilegeId } = await params\n    const $1 = Number.parseInt(id)\n    const $2 = Number.parseInt(privilegeId)');
    
    content = content.replace(/const\s+(\w+)\s*=\s*Number\.parseInt\(params\.id\)\s*\n\s*const\s+(\w+)\s*=\s*Number\.parseInt\(params\.roleId\)/g,
      'const { id, roleId } = await params\n    const $1 = Number.parseInt(id)\n    const $2 = Number.parseInt(roleId)');
    
    // Handle direct params.id access without Number.parseInt
    content = content.replace(/params\.id(?!\w)/g, '(await params).id');
    content = content.replace(/params\.database(?!\w)/g, '(await params).database');
    content = content.replace(/params\.privilegeId(?!\w)/g, '(await params).privilegeId');
    content = content.replace(/params\.roleId(?!\w)/g, '(await params).roleId');
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

console.log('🔧 Fixing Next.js 15 dynamic route parameters...\n');

const routeFiles = findRouteFiles(apiDir);
let fixedCount = 0;

for (const file of routeFiles) {
  if (fixParamsInFile(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} route files!`);
console.log('✅ All API routes now use awaited params for Next.js 15 compatibility.');
