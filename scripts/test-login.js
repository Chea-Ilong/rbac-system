#!/usr/bin/env node

async function testLogin() {
  const credentials = [
    { name: 'admin', password: 'admin123', description: 'RBAC Administrator' },
    { name: 'phsar_admin', password: 'temp123', description: 'PhsarDesign3 Admin' },
    { name: 'phsar_client', password: 'temp123', description: 'PhsarDesign3 Client' },
    { name: 'phsar_freelancer', password: 'temp123', description: 'PhsarDesign3 Freelancer' },
    { name: 'phsar_moderator', password: 'temp123', description: 'PhsarDesign3 Moderator' }
  ];

  console.log('🔐 Testing Login Credentials...\n');

  for (const cred of credentials) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: cred.name, 
          password: cred.password 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${cred.description}`);
        console.log(`   Username: ${cred.name}`);
        console.log(`   Password: ${cred.password}`);
        console.log(`   User: ${data.user.name}`);
        console.log(`   Roles: ${data.user.roles.join(', ')}`);
        console.log(`   Message: ${data.message}\n`);
      } else {
        console.log(`❌ ${cred.description}`);
        console.log(`   Username: ${cred.name}`);
        console.log(`   Error: ${data.error}\n`);
      }
    } catch (error) {
      console.log(`❌ ${cred.description}`);
      console.log(`   Username: ${cred.name}`);
      console.log(`   Error: Connection failed - ${error.message}\n`);
    }
  }

  console.log('📋 Available Login Credentials:');
  console.log('============================');
  credentials.forEach(cred => {
    console.log(`${cred.description}:`);
    console.log(`  Username: ${cred.name}`);
    console.log(`  Password: ${cred.password}`);
    console.log('');
  });
}

testLogin();
