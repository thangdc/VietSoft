# VietSoft QR Pro License Setup

This document describes the production Ed25519 license setup for VietSoft QR Code Generator.

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

It reads the private key from the `VIETSOFT_QR_PRIVATE_KEY` environment variable.

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

Lifetime license:

```powershell
node tools/generate-qr-license.js VSQR-00001
```

Timed license:

```powershell
node tools/generate-qr-license.js VSQR-00001 2027-09-23
```

The command outputs a license in this format:

```
VSQR1.<payload>.<signature>
```

Copy the complete value and provide it to the customer.

## 6. Verify the generated license

Paste the generated license into the QR Code Generator's Pro license activation UI.

The browser verifies the Ed25519 signature using the public key embedded in:

```
libs/custom/qr-code-license.js
```

The private key is not required by the website.

## 7. Production checklist

Before issuing the first real license:

- [ ] Generate a production Ed25519 key pair.
- [ ] Back up the private key securely.
- [ ] Add the generated public key to `qr-code-license.js`.
- [ ] Merge the public-key PR.
- [ ] Confirm a license generated with the production private key activates successfully.
- [ ] Add the private/public PEM files to `.gitignore` if they are stored inside the local repository folder.
- [ ] Never commit the private key.
- [ ] Keep the private key only on trusted local/offline storage.

Recommended `.gitignore` entries:

```gitignore
vietsoft-qr-license-private.pem
vietsoft-qr-license-public.pem
```

The public key may be committed directly to `qr-code-license.js`; the public PEM file itself does not need to be stored in the repository.
