#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

const SUPABASE_URL = 'https://yatmdgjkljmaohdkvzkd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ZTRNO7lC0PzRgIfNU9qWtQ_CvXdx6cV';
const CREATE_LICENSE_URL = SUPABASE_URL + '/functions/v1/create-license';

function usage() {
  console.error('Usage: node tools/generate-qr-license.js <email> [expiresAt]');
  console.error('Example: node tools/generate-qr-license.js customer@example.com');
  console.error('Example: node tools/generate-qr-license.js customer@example.com 2027-09-23');
  process.exit(1);
}

function generateLicenseId() {
  return 'VSQR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidExpiry(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function registerLicense(licenseKey, adminKey) {
  let response;
  try {
    response = await fetch(CREATE_LICENSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'x-license-admin-key': adminKey
      },
      body: JSON.stringify({ licenseKey })
    });
  } catch (error) {
    throw new Error('Cannot connect to the License server.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (error) {}

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'License server rejected the request.');
  }

  return data;
}

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const expiresAt = String(process.argv[3] || '').trim();

  if (!email) usage();

  if (!isValidEmail(email)) {
    console.error('Invalid email:', email);
    process.exit(1);
  }

  if (!isValidExpiry(expiresAt)) {
    console.error('Invalid expiry date. Use YYYY-MM-DD:', expiresAt);
    process.exit(1);
  }

  const adminKey = process.env.VIETSOFT_LICENSE_ADMIN_KEY || '';
  if (!adminKey) {
    console.error('Missing VIETSOFT_LICENSE_ADMIN_KEY.');
    console.error('Set the same admin key configured for the create-license Supabase function.');
    process.exit(1);
  }

  const privateKeyPath = process.env.VIETSOFT_QR_PRIVATE_KEY || './vietsoft-qr-license-private.pem';
  if (!fs.existsSync(privateKeyPath)) {
    console.error('Private key not found:', privateKeyPath);
    console.error('Set VIETSOFT_QR_PRIVATE_KEY to the path of your private Ed25519 key.');
    process.exit(1);
  }

  const licenseId = generateLicenseId();
  const payload = {
    product: 'vietsoft-qr',
    plan: 'pro',
    type: expiresAt ? 'timed' : 'lifetime',
    licenseId,
    email,
    issuedAt: new Date().toISOString().slice(0, 10)
  };

  if (expiresAt) payload.expiresAt = expiresAt;

  const payloadPart = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
  const signature = crypto.sign(null, Buffer.from(payloadPart, 'utf8'), privateKey).toString('base64url');
  const licenseKey = 'VSQR1.' + payloadPart + '.' + signature;

  const registered = await registerLicense(licenseKey, adminKey);

  console.log('');
  console.log('License created successfully.');
  console.log('License ID :', registered.licenseId);
  console.log('Email      :', registered.email);
  console.log('Plan       :', registered.plan);
  console.log('Expires    :', registered.expiresAt || 'Lifetime');
  console.log('Max devices:', registered.maxDevices);
  console.log('License Key:');
  console.log(licenseKey);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
