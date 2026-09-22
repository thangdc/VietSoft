(function () {
'use strict';

var currentType = 'url';
var currentData = '';
var currentImage = '';
var historyKey = 'vietsoft_qr_history_v2';

function track(name, params) {
    if (window.vietsoftAnalytics) window.vietsoftAnalytics.track(name, params || {});
}

function esc(value) {
    return String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var fields = {
    url: {title:'Tạo QR cho URL', html:'<div class="vs-field"><label>URL</label><input id="vsUrl" type="url" placeholder="https://example.com"></div>'},
    text: {title:'Tạo QR cho văn bản', html:'<div class="vs-field"><label>Nội dung</label><textarea id="vsText" rows="7" placeholder="Nhập nội dung cần mã hóa..."></textarea></div>'},
    contact: {title:'Tạo QR cho liên hệ', html:'<div class="vs-grid2"><div class="vs-field"><label>Họ tên</label><input id="vsName"></div><div class="vs-field"><label>Điện thoại</label><input id="vsPhone"></div></div><div class="vs-grid2"><div class="vs-field"><label>Email</label><input id="vsEmail"></div><div class="vs-field"><label>Website</label><input id="vsWebsite" placeholder="https://"></div></div><div class="vs-field"><label>Địa chỉ</label><input id="vsAddress"></div>'},
    wifi: {title:'Tạo QR cho Wi-Fi', html:'<div class="vs-field"><label>Tên mạng (SSID)</label><input id="vsSsid" placeholder="My Wi-Fi"></div><div class="vs-grid2"><div class="vs-field"><label>Mật khẩu</label><input id="vsWifiPass" type="password"></div><div class="vs-field"><label>Bảo mật</label><select id="vsWifiAuth"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Không mật khẩu</option></select></div></div><div class="vs-field"><label><input id="vsHidden" type="checkbox" style="width:auto"> Mạng ẩn</label></div>'},
    email: {title:'Tạo QR cho Email', html:'<div class="vs-field"><label>Email</label><input id="vsEmailTo" type="email"></div><div class="vs-field"><label>Tiêu đề</label><input id="vsEmailSubject"></div><div class="vs-field"><label>Nội dung</label><textarea id="vsEmailBody" rows="5"></textarea></div>'},
    phone: {title:'Tạo QR cho số điện thoại', html:'<div class="vs-field"><label>Số điện thoại</label><input id="vsPhoneNumber" type="tel" placeholder="+84..."></div>'},
    sms: {title:'Tạo QR cho SMS', html:'<div class="vs-field"><label>Số điện thoại</label><input id="vsSmsPhone" type="tel"></div><div class="vs-field"><label>Nội dung</label><textarea id="vsSmsBody" rows="5"></textarea></div>'},
    location: {title:'Tạo QR cho vị trí', html:'<div class="vs-field"><label>Latitude</label><input id="vsLat" type="number" step="any" value="10.78778"></div><div class="vs-field"><label>Longitude</label><input id="vsLng" type="number" step="any" value="106.662483"></div><p style="color:#667085;font-size:13px">Nhập tọa độ GPS để tạo QR mở vị trí trên ứng dụng bản đồ.</p>'}
};

function renderFields(type) {
    currentType = type;
    $('#vsFormTitle').text(fields[type].title);
    $('#vsFields').html(fields[type].html);
    $('#vsStatus').text('');
    $('#vsTabs a').removeClass('active').filter('[data-type="' + type + '"]').addClass('active');
    track('qr_type_select', {qr_type:type});
}

function value(id) { return $('#' + id).val() || ''; }

function buildData() {
    switch(currentType) {
        case 'url': return value('vsUrl').trim();
        case 'text': return value('vsText');
        case 'contact': return 'MECARD:N:' + value('vsName') + ';TEL:' + value('vsPhone') + ';EMAIL:' + value('vsEmail') + ';URL:' + value('vsWebsite') + ';ADR:' + value('vsAddress') + ';;';
        case 'wifi': return 'WIFI:T:' + value('vsWifiAuth') + ';S:' + value('vsSsid').replace(/[;,:]/g,'\\$&') + ';P:' + value('vsWifiPass').replace(/[;,:]/g,'\\$&') + ';H:' + ($('#vsHidden').prop('checked') ? 'true' : 'false') + ';;';
        case 'email': return 'MATMSG:TO:' + value('vsEmailTo') + ';SUB:' + value('vsEmailSubject') + ';BODY:' + value('vsEmailBody') + ';;';
        case 'phone': return 'tel:' + value('vsPhoneNumber');
        case 'sms': return 'SMSTO:' + value('vsSmsPhone') + ':' + value('vsSmsBody');
        case 'location': return 'geo:' + value('vsLat') + ',' + value('vsLng');
    }
    return '';
}

function saveHistory(data) {
    var items = JSON.parse(localStorage.getItem(historyKey) || '[]');
    items.unshift({type:currentType, data:data, time:new Date().toLocaleString()});
    localStorage.setItem(historyKey, JSON.stringify(items.slice(0,5)));
    renderHistory();
}
function renderHistory() {
    var items = JSON.parse(localStorage.getItem(historyKey) || '[]');
    $('#vsHistory').html(items.length ? items.map(function(x){return '<div class="vs-history-item"><span><strong>'+esc(x.type)+'</strong><br>'+esc(x.data.substring(0,38))+'</span><span>'+esc(x.time)+'</span></div>';}).join('') : '<span style="color:#98a2b3;font-size:12px">Chưa có mã QR nào.</span>');
}
function setStatus(text) { $('#vsStatus').text(text); }

function generate() {
    if (typeof QRCode === 'undefined') { setStatus('Thư viện QR chưa tải xong. Vui lòng thử lại sau vài giây.'); return; }
    var data = buildData();
    if (!data.trim()) { setStatus('Vui lòng nhập nội dung.'); return; }
    if (currentType === 'url' && !/^https?:\/\//i.test(data)) { setStatus('URL nên bắt đầu bằng http:// hoặc https://'); return; }
    var size = parseInt($('#vsSize').val(),10) || 300;
    var preview = document.getElementById('vsPreview');
    preview.innerHTML = '<div id="vsQrCanvas"></div>';
    try {
        new QRCode(document.getElementById('vsQrCanvas'), {text:data,width:size,height:size,correctLevel:QRCode.CorrectLevel[$('#vsLevel').val()] || QRCode.CorrectLevel.M});
        setTimeout(function(){
            var canvas = $('#vsQrCanvas canvas')[0];
            var img = $('#vsQrCanvas img')[0];
            currentImage = canvas ? canvas.toDataURL('image/png') : (img ? img.src : '');
            if (currentImage) {
                preview.innerHTML = '<img src="' + currentImage + '" alt="QR Code">';
                $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',false);
                setStatus('✓ QR Code đã được tạo');
                saveHistory(data);
                track('qr_generate',{qr_type:currentType});
            } else setStatus('Không thể tạo QR Code.');
        },100);
    } catch(e) {
        setStatus('Không thể tạo QR Code. Vui lòng thử lại.');
    }
}
$(function(){
    renderFields('url');
    renderHistory();
    $('#vsTabs').on('click','a',function(e){e.preventDefault();renderFields($(this).data('type'));});
    $('#vsGenerate').on('click',generate);
    $('#vsClear').on('click',function(){renderFields(currentType);$('#vsStatus').text('');});
    $('#vsDownload').on('click',function(){if(!currentImage)return;var a=document.createElement('a');a.href=currentImage;a.download='vietsoft-qr-' + currentType + '.png';a.click();track('qr_download',{qr_type:currentType,format:'png'});});
    $('#vsCopy').on('click',async function(){if(!currentImage)return;try{var blob=await (await fetch(currentImage)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);setStatus('✓ Đã sao chép ảnh QR');track('qr_copy',{qr_type:currentType});}catch(e){setStatus('Trình duyệt không hỗ trợ sao chép ảnh. Hãy dùng Tải PNG.');}});
    $('#vsOpen').on('click',function(){if(currentImage)window.open(currentImage,'_blank');});
});
})();