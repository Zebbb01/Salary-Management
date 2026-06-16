// Script to execute SQL migration against Supabase
// Run with: node scripts/setup-db.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://lwcszyilzwnrjrcmpbgy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3N6eWlsenducmpyY21wYmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU0OTg5OSwiZXhwIjoyMDk3MTI1ODk5fQ.BeSfA4BVVfWn4rMel4AGKXKCooErYgUatPRdSZw5yXw';

const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
const sql = readFileSync(sqlPath, 'utf-8');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function executeSql(statement) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: statement }),
  });
  return resp;
}

// Try using the pg_net extension or direct SQL endpoint
async function main() {
  console.log('Setting up database schema...');
  console.log('SQL file loaded:', sqlPath);
  console.log(`Found ${statements.length} statements`);
  
  // The Supabase REST API doesn't support raw SQL execution directly.
  // You need to run this SQL in the Supabase Dashboard SQL Editor.
  console.log('\\n==========================================');
  console.log('MANUAL STEP REQUIRED');
  console.log('==========================================');
  console.log('Please copy the SQL from:');
  console.log(sqlPath);
  console.log('\\nAnd paste it into the Supabase SQL Editor at:');
  console.log(`${SUPABASE_URL.replace('.supabase.co', '')}/project/lwcszyilzwnrjrcmpbgy/sql/new`);
  console.log('\\nOr visit: https://supabase.com/dashboard/project/lwcszyilzwnrjrcmpbgy/sql/new');
  console.log('==========================================');
}

main().catch(console.error);
