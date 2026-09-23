#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

function usage() {
  console.error('Usage: node tools/generate-qr-license.js <licenseId> <email> [expiresAt]');
  console.error('Example: node tools/generate-qr-license.js VSQR-8F42K customer@example.com');
  console.error('Example: node tools/generate-qr-license.js VSQR-8F42K customer@example.com 2027-09-23');
  process.exit(1);
}

const licenseId = process.argv[2];
const email = String(process.argv[3] || '').trim().toLowerCase();
const expiresAt = process.argv[4] || '';
if (!licenseId || !email) usage();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Invalid email:', email);
  process.exit(1);
}

const privateKeyPath = process.env.VIETSOFT_QR_PRIVATE_KEY || './vietsoft-qr-license-private.pem';
if (!fs.existsSync(privateKeyPath)) {
  console.error('Private key not found:', privateKeyPath);
  console.error('Set VIETSOFT_QR_PRIVATE_KEY to the path of your private Ed25519 key.');
  process.exit(1);
}

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

console.log('VSQR1.' + payloadPart + '.' + signature);
