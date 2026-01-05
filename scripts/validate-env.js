#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * This script validates your Supabase environment configuration
 * and provides actionable feedback for fixing any issues.
 */

const fs = require('fs');
const path = require('path');

// Validation constants
const MIN_JWT_SIGNATURE_LENGTH = 20;  // Minimum to be considered valid
const WARN_JWT_SIGNATURE_LENGTH = 40; // Warn if below this
const EXPECTED_JWT_SIGNATURE_LENGTH = 43; // Typical HS256 signature length

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    
    // Parse KEY=VALUE format
    // Handle both quoted and unquoted values
    const match = trimmedLine.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} else {
  console.error('❌ .env.local file not found!');
  console.log('\n   🔧 FIX: Create a .env.local file in the project root');
  console.log('   See .env.example for template\n');
  process.exit(1);
}

console.log('\n🔍 Validating Supabase Environment Configuration...\n');

const errors = [];
const warnings = [];

// Check NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (!supabaseUrl) {
  errors.push('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
} else {
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      errors.push('❌ NEXT_PUBLIC_SUPABASE_URL must use http or https protocol');
    } else {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL: Valid format');
      console.log(`   URL: ${supabaseUrl}`);
      
      if (url.protocol === 'http:') {
        warnings.push('⚠️  Using HTTP (not HTTPS) - Only use for local development!');
      }
    }
  } catch (error) {
    errors.push(`❌ NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${error.message}`);
  }
}

// Check SUPABASE_SERVICE_ROLE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!serviceRoleKey) {
  errors.push('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
} else {
  const parts = serviceRoleKey.split('.');
  
  if (parts.length !== 3) {
    errors.push(`❌ SUPABASE_SERVICE_ROLE_KEY: Invalid JWT format (found ${parts.length} parts, expected 3)`);
    console.log('   JWT must have 3 parts: header.payload.signature');
  } else {
    const [header, payload, signature] = parts;
    
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY: Valid JWT structure');
    console.log(`   Header length: ${header.length} characters`);
    console.log(`   Payload length: ${payload.length} characters`);
    console.log(`   Signature length: ${signature.length} characters`);
    
    if (signature.length < MIN_JWT_SIGNATURE_LENGTH) {
      errors.push(`❌ SUPABASE_SERVICE_ROLE_KEY: Signature appears truncated (${signature.length} chars, expected ~${EXPECTED_JWT_SIGNATURE_LENGTH})`);
      console.log('\n   🔧 FIX: Copy the complete service_role key from Supabase Settings > API');
      console.log('   The key should be 200+ characters long total.');
    } else if (signature.length < WARN_JWT_SIGNATURE_LENGTH) {
      warnings.push(`⚠️  SUPABASE_SERVICE_ROLE_KEY: Signature seems short (${signature.length} chars, typically ~${EXPECTED_JWT_SIGNATURE_LENGTH})`);
    } else {
      console.log('✅ Signature length looks good');
    }
    
    // Try to decode payload to verify it's a proper JWT
    try {
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      if (decodedPayload.role === 'service_role') {
        console.log('✅ JWT role: service_role (correct)');
      } else {
        errors.push(`❌ JWT role is "${decodedPayload.role}" but should be "service_role"`);
        console.log('\n   🔧 FIX: You may have copied the anon key instead of the service_role key');
      }
      
      if (decodedPayload.ref) {
        console.log(`✅ JWT project ref: ${decodedPayload.ref}`);
      }
      
      if (decodedPayload.exp) {
        const expDate = new Date(decodedPayload.exp * 1000);
        if (expDate > new Date()) {
          console.log(`✅ JWT expires: ${expDate.toLocaleDateString()} (not expired)`);
        } else {
          errors.push(`❌ JWT has expired: ${expDate.toLocaleDateString()}`);
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        warnings.push('⚠️  Could not parse JWT payload: Invalid JSON structure');
      } else {
        warnings.push(`⚠️  Could not decode JWT payload: ${e.message}`);
      }
    }
  }
}

// Check NEXT_PUBLIC_SUPABASE_ANON_KEY (optional but recommended)
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
if (!anonKey) {
  warnings.push('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is missing (optional for this app)');
} else {
  const parts = anonKey.split('.');
  if (parts.length === 3 && parts[2].length > 40) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Present and valid format');
  } else {
    warnings.push('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY: Format looks incorrect');
  }
}

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📋 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ All environment variables are correctly configured!');
  console.log('\nNext steps:');
  console.log('1. Run SQL migrations in Supabase SQL Editor:');
  console.log('   - scripts/001_create_tables.sql');
  console.log('   - scripts/002_add_resecon_settings.sql');
  console.log('   - scripts/003_add_reminder_settings.sql');
  console.log('   - scripts/005_add_treatment_type_field.sql');
  console.log('2. Start the application: npm run dev');
  console.log('3. Open http://localhost:3000\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(error => console.log('  ' + error));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log('  ' + warning));
}

console.log('\n📖 For detailed help, see:');
console.log('  - TROUBLESHOOTING.md');
console.log('  - scripts/README.md');
console.log('  - README.md\n');

process.exit(errors.length > 0 ? 1 : 0);
