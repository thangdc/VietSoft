(function () {
'use strict';

var PUBLIC_KEY_SPKI_BASE64 = 'MCowBQYDK2VwAyEAMlFMNDZxhns+ze0eW8P+bw3yNVFU4wpK2Oz8zUdfMbg=';
var STORAGE_KEY = 'vietsoft_qr_license_v1';
var PRODUCT = 'vietsoft-qr';

function base64UrlToBytes(value) {
    var normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    while (normalized.length % 4) normalized += '=';
    var binary = atob(normalized);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function bytesToBase64Url(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function utf8Bytes(value) {
    return new TextEncoder().encode(String(value || ''));
}

function parseLicense(license) {
    var parts = String(license || '').trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'VSQR1') throw new Error('License không hợp lệ.');
    var payloadJson = new TextDecoder().decode(base64UrlToBytes(parts[1]));
    var payload = JSON.parse(payloadJson);
    if (!payload || payload.product !== PRODUCT) throw new Error('License không dành cho VietSoft QR Code Generator.');
    return { raw: String(license || '').trim(), payload: payload, payloadPart: parts[1], signaturePart: parts[2] };
}

async function verifyLicense(license) {
    try {
        var parsed = parseLicense(license);
        var key = await crypto.subtle.importKey(
            'spki',
            base64UrlToBytes(PUBLIC_KEY_SPKI_BASE64),
            { name: 'Ed25519' },
            false,
            ['verify']
        );
        var valid = await crypto.subtle.verify(
            { name: 'Ed25519' },
            key,
            base64UrlToBytes(parsed.signaturePart),
            utf8Bytes(parsed.payloadPart)
        );
        if (!valid) return { valid: false, message: 'License không hợp lệ hoặc đã bị thay đổi.' };
        if (parsed.payload.expiresAt && new Date(parsed.payload.expiresAt + 'T23:59:59') < new Date()) {
            return { valid: false, message: 'License đã hết hạn.' };
        }
        return { valid: true, payload: parsed.payload, license: parsed.raw };
    } catch (e) {
        return { valid: false, message: e && e.message ? e.message : 'Không thể xác thực License.' };
    }
}

async function activate(license) {
    var result = await verifyLicense(license);
    if (!result.valid) return result;
    localStorage.setItem(STORAGE_KEY, result.license);
    return result;
}

async function getActiveLicense() {
    var stored = localStorage.getItem(STORAGE_KEY) || '';
    if (!stored) return { valid: false, message: 'Chưa kích hoạt Pro.' };
    var result = await verifyLicense(stored);
    if (!result.valid) {
        localStorage.removeItem(STORAGE_KEY);
        return result;
    }
    return result;
}

window.VietSoftQrLicense = {
    activate: activate,
    verify: verifyLicense,
    getActive: getActiveLicense,
    isPro: async function () {
        var result = await getActiveLicense();
        return !!result.valid;
    },
    clear: function () {
        localStorage.removeItem(STORAGE_KEY);
    }
};
})();