# VietSoft QR Pro License Setup

This document describes the production Ed25519 license setup for VietSoft QR Code Generator.

The license is **offline and signature-based**: the web application verifies a signed license in the browser. No customer email or license key is sent to a licensing server.

## 1. Generate a new Ed25519 key pair

Use Node.js so the generated private key format matches the existing license generator.

Run this from the repository root:

```powershell
node -e "const c=require('crypto'),fs=require('fs');const {privateKey,publicKey}=c.generateKeyPairSync('ed25519');fs.writeFileSync('vietsoft-qr-license-private.pem',privateKey.export({type:'pkcs8',format:'pem'}));fs.writeFileSync('vietsoft-qr-license-public.pem',publicKey.export({type:'spki',format:'pem'}));console.log('Created private/public key pair')"
```

This creates:

- `vietsoft-qr-license-private.pem` — **secret; never commit or publish this file**
- `vietsoft-qr-license-public.pem` — public key; safe to use for application verification

For production, keep a secure offline backup of the private key. If the private key is lost, licenses cannot be generated with the same signing identity. If it is exposed, generate a new key pair and update the application public key.

## 2. Get the public key in the format used by the web application

Run:

```powershell
node -e "const fs=require('fs'),c=require('crypto');const k=c.createPublicKey(fs.readFileSync('vietsoft-qr-license-public.pem'));console.log(k.export({type:'spki',format:'der'}).toString('base64'))"
```

The output is a base64 SPKI public key, for example:

```
MCowBQYDK2VwAyEAWnPQe6rm1DUSVDAKaO6YzFk7+aOQu6+o047Pc0aNslw=
```

Do not use the example above unless it is the public key corresponding to the private key you intend to use.

## 3. Update the public key in the web application

Open:

```
libs/custom/qr-code-license.js
```

Update:

```javascript
var PUBLIC_KEY_SPKI_BASE64 = 'YOUR_PUBLIC_KEY';
```

Replace `YOUR_PUBLIC_KEY` with the base64 SPKI value generated in step 2.

Only the public key goes into the repository. **Never put the private key into JavaScript, GitHub, or the web application.**

Create a PR for this change and merge it before issuing production licenses.

## 4. Configure the local license generator

The license generator is:

```
tools/generate-qr-license.js
```

It reads the private key from the `VIETSOFT_QR_PRIVATE_KEY` environment variable, or falls back to `./vietsoft-qr-license-private.pem`.

PowerShell:

```powershell
$env:VIETSOFT_QR_PRIVATE_KEY="$PWD\vietsoft-qr-license-private.pem"
```

Verify that the file exists before generating a license:

```powershell
Test-Path $env:VIETSOFT_QR_PRIVATE_KEY
```

It should return:

```
True
```

## 5. Generate a Pro license key

Every Pro license is bound to the customer's purchase email. The email is included in the signed payload and is checked when the customer activates the license.

### Lifetime license

```powershell
node tools/generate-qr-license.js VSQR-8F42K customer@example.com
```

### Timed license

```powershell
node tools/generate-qr-license.js VSQR-8F42K customer@example.com 2027-09-23
```

The generator normalizes the email to lowercase and validates its basic email format.

The command outputs a license in this format:

```
VSQR1.<payload>.<signature>
```

The signed payload contains product, plan, license type, license ID, customer email, issued date, and optional expiry date. Copy the complete value and provide it to the customer.

## 6. Activate the Pro license

Paste the generated license into the QR Code Generator's Pro license activation UI.

The browser verifies the Ed25519 signature using the public key embedded in:

```
libs/custom/qr-code-license.js
```

The private key is not required by the website. The entered email must match the email stored in the signed license payload; a missing or different email is rejected. The license is stored locally in the browser, and customer email is not sent to analytics.

## 7. License format and security

A license has three parts:

```
VSQR1.<payload>.<signature>
```

The payload is base64url-encoded JSON and the signature is an Ed25519 signature over the payload portion.

The private key is used only by the local license generator to sign licenses. Never commit it, put it in frontend JavaScript, GitHub Actions logs, or customer-facing files. Do not use customer email as a secret.

## 8. Verify a generated license

A valid license must have product=`vietsoft-qr`, plan=`pro`, a valid Ed25519 signature, a valid customer email, a matching entered email, and no expired `expiresAt` date. For a lifetime license, `expiresAt` is omitted.

## 9. Production checklist

Before issuing the first real license:

- [ ] Generate a production Ed25519 key pair.
- [ ] Back up the private key securely.
- [ ] Add the generated public key to `qr-code-license.js`.
- [ ] Merge the public-key PR.
- [ ] Generate a test license with a test email using the production private key.
- [ ] Confirm the test license activates successfully with the same email.
- [ ] Confirm a different email is rejected.
- [ ] Confirm an expired timed license is rejected.
- [ ] Confirm Excel export, ZIP export, import, and print are gated by Pro licensing.
- [ ] Never commit the private key.
- [ ] Keep the private key only on trusted local/offline storage.

The repository intentionally ignores only the private key:

```gitignore
vietsoft-qr-license-private.pem
```

The public key PEM may be committed if useful for operational documentation or key management. The frontend public key remains in `qr-code-license.js`.
