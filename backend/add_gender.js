const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addGender() {
  // Add gender column
  const { error: alterError } = await supabase.rpc('exec_sql', { 
    query: "ALTER TABLE products ADD COLUMN IF NOT EXISTS gender text DEFAULT 'unisex';" 
  });
  console.log('Alter:', alterError);
  
  // Set existing to male
  const { error: updateError } = await supabase.from('products').update({ gender: 'male' }).neq('name', 'dummy');
  console.log('Update existing to male:', updateError);
}
addGender();
