const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lwcszyilzwnrjrcmpbgy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3N6eWlsenducmpyY21wYmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU0OTg5OSwiZXhwIjoyMDk3MTI1ODk5fQ.BeSfA4BVVfWn4rMel4AGKXKCooErYgUatPRdSZw5yXw';

async function main() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Executing SQL migration against Supabase...');

  // Use Supabase's SQL execution endpoint (available with service role)
  const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/', {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({})
  });

  // If the RPC endpoint doesn't work, try the pg/query endpoint
  console.log('Trying direct SQL execution...');
  
  const pgResponse = await fetch('https://lwcszyilzwnrjrcmpbgy.supabase.co/pg/query', {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('PG Query Response Status:', pgResponse.status);
  const text = await pgResponse.text();
  console.log('Response:', text.substring(0, 500));
  
  if (pgResponse.ok) {
    console.log('\nDatabase schema created successfully!');
  } else {
    console.log('\n==========================================');
    console.log('MANUAL STEP REQUIRED');
    console.log('==========================================');
    console.log('Please run the SQL migration manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/lwcszyilzwnrjrcmpbgy/sql/new');
    console.log('2. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('3. Click "Run"');
    console.log('==========================================');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
});
