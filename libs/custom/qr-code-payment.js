(function () {
'use strict';

var SUPABASE_URL = 'https://yatmdgjkljmaohdkvzkd.supabase.co';
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ZTRNO7lC0PzRgIfNU9qWtQ_CvXdx6cV';
var CREATE_PAYMENT_URL = SUPABASE_URL + '/functions/v1/create-zalopay-payment';
var CHECK_PAYMENT_URL = SUPABASE_URL + '/functions/v1/check-zalopay-payment';
var ISSUE_LICENSE_URL = SUPABASE_URL + '/functions/v1/issue-license-from-payment';
var currentPayment = null;
var pollingTimer = null;
var pollingStartedAt = 0;

function formatVnd(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function callFunction(url, body) {
    var response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify(body)
        });
    } catch (e) {
        throw new Error('Không thể kết nối máy chủ thanh toán.');
    }

    var data = {};
    try { data = await response.json(); } catch (e) {}
    if (!response.ok || !data.success) throw new Error(data.message || 'Yêu cầu thanh toán thất bại.');
    return data;
}

function renderPaymentQr(value) {
    var qrValue = String(value || '');
    if (!qrValue) return false;

    if (window.qrcode) {
        try {
            var qr = qrcode(0, 'M');
            qr.addData(qrValue);
            qr.make();
            $('#vsPaymentQr').attr('src', qr.createDataURL(6, 8));
            return true;
        } catch (e) {
            console.warn('Unable to render ZaloPay QR:', e);
        }
    }

    return false;
}

function openPaymentModal(defaultPlan) {
    var modal = $('#vsPaymentModal');
    if (!modal.length) return;
    stopPolling();
    currentPayment = null;
    $('#vsPaymentPlan').val(defaultPlan || 'annual').trigger('change');
    $('#vsPaymentEmail').val('');
    $('#vsPaymentAmount').text(formatVnd($('#vsPaymentPlan').val() === 'annual' ? 199000 : 39000));
    $('#vsPaymentQr').attr('src', '');
    $('#vsPaymentOrderId').text('Chưa tạo');
    $('#vsPaymentStatus').text('Nhập email rồi nhấn “Tạo giao dịch thanh toán”.');
    $('#vsPaymentDone').text('Tạo giao dịch thanh toán').prop('disabled', false);
    modal.addClass('is-open').attr('aria-hidden', 'false');
    $('body').addClass('vs-payment-modal-open');
    setTimeout(function () { $('#vsPaymentEmail').trigger('focus'); }, 50);
}

function closePaymentModal() {
    stopPolling();
    var modal = $('#vsPaymentModal');
    if (!modal.length) return;
    modal.removeClass('is-open').attr('aria-hidden', 'true');
    $('body').removeClass('vs-payment-modal-open');
}

function updatePaymentSummary() {
    var plan = $('#vsPaymentPlan').val() || 'annual';
    var amount = plan === 'annual' ? 199000 : 39000;
    $('#vsPaymentAmount').text(formatVnd(amount));
    $('#vsPaymentPlanLabel').text(plan === 'annual' ? 'Pro / năm' : 'Pro / tháng');
}

async function createPayment() {
    var plan = $('#vsPaymentPlan').val() || 'annual';
    var email = String($('#vsPaymentEmail').val() || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
        $('#vsPaymentStatus').text('Vui lòng nhập email hợp lệ để nhận License Key.');
        $('#vsPaymentEmail').trigger('focus');
        return;
    }

    stopPolling();
    $('#vsPaymentDone').prop('disabled', true).text('Đang tạo giao dịch...');
    $('#vsPaymentStatus').text('Đang tạo mã thanh toán ZaloPay...');
    $('#vsPaymentStatusShort').text('Đang tạo giao dịch');

    try {
        var result = await callFunction(CREATE_PAYMENT_URL, {
            productCode: 'vietsoft-qr',
            planCode: plan,
            email: email
        });

        currentPayment = result.payment;
        $('#vsPaymentAmount').text(formatVnd(currentPayment.amount));
        $('#vsPaymentOrderId').text(currentPayment.provider_order_id || currentPayment.id);
        $('#vsPaymentDone').text('Tôi đã thanh toán');
        $('#vsPaymentStatus').text('Quét QR để thanh toán. Hệ thống sẽ tự kiểm tra trạng thái giao dịch.');
        $('#vsPaymentStatusShort').text('Đang chờ thanh toán');
        $('#vsPaymentQrCaption').text('Quét bằng ZaloPay hoặc ứng dụng ngân hàng hỗ trợ VietQR');

        if (!renderPaymentQr(currentPayment.qr_code)) {
            $('#vsPaymentStatus').text('Không thể hiển thị QR. Bạn có thể mở trang thanh toán ZaloPay.');
        }

        $('#vsPaymentOpenGateway').attr('href', currentPayment.order_url || '#').toggle(!!currentPayment.order_url);
        $('#vsPaymentDone').prop('disabled', false);
        startPolling();
    } catch (e) {
        $('#vsPaymentStatus').text(e && e.message ? e.message : 'Không thể tạo giao dịch.');
        $('#vsPaymentDone').prop('disabled', false).text('Tạo giao dịch thanh toán');
    }
}

function stopPolling() {
    if (pollingTimer) {
        clearTimeout(pollingTimer);
        pollingTimer = null;
    }
}

function startPolling() {
    stopPolling();
    pollingStartedAt = Date.now();
    pollPayment();
}

async function pollPayment() {
    if (!currentPayment || Date.now() - pollingStartedAt > 15 * 60 * 1000) {
        stopPolling();
        if (currentPayment) $('#vsPaymentStatus').text('Giao dịch đã hết thời gian chờ. Bạn có thể tạo giao dịch mới.');
        return;
    }

    try {
        var result = await callFunction(CHECK_PAYMENT_URL, { paymentId: currentPayment.id });
        currentPayment = result.payment || currentPayment;

        if (currentPayment.status === 'paid') {
            $('#vsPaymentStatusShort').text('Đã thanh toán');
            await issueLicense();
            return;
        }

        $('#vsPaymentStatus').text('Đang chờ xác nhận thanh toán...');
        $('#vsPaymentStatusShort').text('Đang chờ thanh toán');
    } catch (e) {
        $('#vsPaymentStatus').text('Chưa xác nhận được thanh toán. Hệ thống sẽ tự kiểm tra lại.');
    }

    pollingTimer = setTimeout(pollPayment, 3000);
}

async function issueLicense() {
    stopPolling();
    $('#vsPaymentDone').prop('disabled', true).text('Đang cấp License...');
    $('#vsPaymentStatus').text('Thanh toán đã xác nhận. Đang cấp License Key...');
    $('#vsPaymentStatusShort').text('Đang cấp License');

    try {
        var result = await callFunction(ISSUE_LICENSE_URL, { paymentId: currentPayment.id });
        var license = result.license;

        $('#vsPaymentStatus').html(
            '<strong>Thanh toán thành công.</strong><br>' +
            'License Pro đã được cấp cho <strong>' + $('<div>').text(license.email).html() + '</strong>.' +
            '<br><small>Thời hạn đến ' + $('<div>').text(license.expiresAt).html() + '.</small>' +
            '<div style="margin-top:10px;word-break:break-all;font-family:monospace;background:#f5f5f5;padding:10px;border-radius:6px;">' +
            $('<div>').text(license.licenseKey).html() +
            '</div>' +
            '<button type="button" class="vs-btn vs-btn-secondary" id="vsPaymentCopyLicense" style="margin-top:8px;">Sao chép License Key</button>'
        );

        $('#vsPaymentDone').text('Đã cấp License').prop('disabled', true);
        $('#vsPaymentStatusShort').text('Pro đã cấp');
        $('#vsPaymentOpenGateway').hide();

        $('#vsPaymentCopyLicense').off('click').on('click', async function () {
            try {
                await navigator.clipboard.writeText(license.licenseKey);
                $(this).text('✓ Đã sao chép License Key');
            } catch (e) {
                $(this).text('Hãy sao chép License Key thủ công');
            }
        });

        var activation = await window.VietSoftQrLicense.activate(license.licenseKey, license.email);
        if (activation.valid) {
            $('#vsPaymentStatus').append('<br><strong>✓ Pro đã được kích hoạt trên thiết bị này.</strong>');
            $(document).trigger('vietsoft:license-changed');
            $('#vsUpgradePro').text('Pro đã kích hoạt').prop('disabled', true);
        } else {
            $('#vsPaymentStatus').append('<br><small>License đã được cấp. Nếu chưa tự kích hoạt, chọn “Đã có License Key? Kích hoạt Pro”.</small>');
        }
    } catch (e) {
        $('#vsPaymentStatus').text(e && e.message ? e.message : 'Thanh toán đã thành công nhưng chưa thể cấp License. Vui lòng thử lại.');
        $('#vsPaymentDone').prop('disabled', false).text('Thử cấp License lại');
    }
}

$(function () {
    if (!$('#vsPaymentModal').length) return;

    window.VietSoftQrLicense.getActive().then(function (result) {
        if (result.valid) $('#vsUpgradePro').text('Pro đã kích hoạt').prop('disabled', true);
    });

    $('#vsUpgradePro').off('click').on('click', async function () {
        var button = $(this);
        var result = await window.VietSoftQrLicense.getActive();
        if (result.valid) {
            button.text('Pro đã kích hoạt').prop('disabled', true);
            return;
        }
        openPaymentModal('annual');
    });

    window.VietSoftQrPayment = {
        open: openPaymentModal,
        close: closePaymentModal
    };

    $('#vsPaymentPlan').on('change', updatePaymentSummary);
    $('#vsPaymentEmail').on('input', function () {
        if (!currentPayment) updatePaymentSummary();
    });
    $('#vsPaymentModalClose').on('click', closePaymentModal);
    $('#vsPaymentModal').on('click', '[data-payment-close="true"]', closePaymentModal);

    $('#vsPaymentDone').on('click', async function () {
        if (currentPayment && currentPayment.status !== 'paid') {
            $('#vsPaymentStatus').text('Đang kiểm tra giao dịch...');
            await pollPayment();
            return;
        }
        if (!currentPayment) await createPayment();
    });

    $('#vsPaymentOpenLicense').on('click', function () {
        closePaymentModal();
        $('#vsProModal').addClass('is-open').attr('aria-hidden', 'false');
        $('#vsProUpgradeView').attr('hidden', '');
        $('#vsProLicenseView').removeAttr('hidden');
        $('#vsProLicenseEmail').val($('#vsPaymentEmail').val() || '');
        $('#vsProLicenseStatus').text('');
        $('#vsProLicenseInput').trigger('focus');
    });

    $(document).on('keydown.qrPaymentModal', function (e) {
        if (e.key === 'Escape') closePaymentModal();
    });
});
})();