#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

function usage() {
  console.error('Usage: node tools/generate-qr-license.js <licenseId> [expiresAt]');
  console.error('Example: node tools/generate-qr-license.js VSQR-8F42K');
  console.error('Example: node tools/generate-qr-license.js VSQR-8F42K 2027-09-23');
  process.exit(1);
}

const licenseId = process.argv[2];
const expiresAt = process.argv[3] || '';
if (!licenseId) usage();

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
  issuedAt: new Date().toISOString().slice(0, 10)
};
if (expiresAt) payload.expiresAt = expiresAt;

const payloadPart = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
const signature = crypto.sign(null, Buffer.from(payloadPart, 'utf8'), privateKey).toString('base64url');

console.log('VSQR1.' + payloadPart + '.' + signature);
