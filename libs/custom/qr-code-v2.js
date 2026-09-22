(function () {
'use strict';

var currentType = 'url';
var currentData = '';
var currentImage = '';
var historyKey = 'vietsoft_qr_history_v2';

var exportTemplates = {
    url: {
        templateId: 6,
        templateName: 'Trang Web',
        columns: ['ID', 'Địa chỉ trang web'],
        getRow: function (item, id) { return [id, item.fields.url || '']; }
    },
    text: {
        templateId: 9,
        templateName: 'Văn Bản',
        columns: ['ID', 'Nội Dung'],
        getRow: function (item, id) { return [id, item.fields.text || '']; }
    },
    phone: {
        templateId: 3,
        templateName: 'Điện Thoại',
        columns: ['ID', 'Số Điện Thoại'],
        getRow: function (item, id) { return [id, item.fields.phone || '']; }
    },
    sms: {
        templateId: 5,
        templateName: 'Tin Nhắn SMS',
        columns: ['ID', 'Số Điện Thoại', 'Nội Dung'],
        getRow: function (item, id) { return [id, item.fields.phone || '', item.fields.body || '']; }
    },
    email: {
        templateId: 2,
        templateName: 'Địa chỉ Email',
        columns: ['ID', 'Email', 'Tiêu Đề', 'Nội Dung'],
        getRow: function (item, id) { return [id, item.fields.email || '', item.fields.subject || '', item.fields.body || '']; }
    },
    contact: {
        templateId: 8,
        templateName: 'Thông Tin Liên Hệ',
        columns: ['ID', 'Họ Tên', 'Số Điện Thoại', 'Website', 'Email', 'Địa chỉ'],
        getRow: function (item, id) {
            return [id, item.fields.name || '', item.fields.phone || '', item.fields.website || '', item.fields.email || '', item.fields.address || ''];
        }
    },
    product: {
        templateId: 4,
        templateName: 'Sản Phẩm',
        columns: ['ID', 'Tên Sản Phẩm', 'Mô Tả', 'Giá'],
        getRow: function (item, id) { return [id, item.fields.name || '', item.fields.description || '', item.fields.price || '']; }
    }
};

function track(name, params) {
    if (window.vietsoftAnalytics) window.vietsoftAnalytics.track(name, params || {});
}

function esc(value) {
    return String(value == null ? '' : value).replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    renderHistory();
    track('qr_type_select', {qr_type:type});
}

function value(id) { return $('#' + id).val() || ''; }

function getRecord() {
    switch(currentType) {
        case 'url': return {fields:{url:value('vsUrl')}};
        case 'text': return {fields:{text:value('vsText')}};
        case 'contact': return {fields:{name:value('vsName'),phone:value('vsPhone'),website:value('vsWebsite'),email:value('vsEmail'),address:value('vsAddress')}};
        case 'wifi': return {fields:{ssid:value('vsSsid'),password:value('vsWifiPass'),auth:value('vsWifiAuth'),hidden:$('#vsHidden').prop('checked')}};
        case 'email': return {fields:{email:value('vsEmailTo'),subject:value('vsEmailSubject'),body:value('vsEmailBody')}};
        case 'phone': return {fields:{phone:value('vsPhoneNumber')}};
        case 'sms': return {fields:{phone:value('vsSmsPhone'),body:value('vsSmsBody')}};
        case 'location': return {fields:{latitude:value('vsLat'),longitude:value('vsLng')}};
    }
    return {fields:{}};
}

function buildData(record) {
    var f = record.fields;
    switch(currentType) {
        case 'url': return f.url.trim();
        case 'text': return f.text;
        case 'contact': return 'MECARD:N:' + f.name + ';TEL:' + f.phone + ';EMAIL:' + f.email + ';URL:' + f.website + ';ADR:' + f.address + ';;';
        case 'wifi': return 'WIFI:T:' + f.auth + ';S:' + f.ssid.replace(/[;,:]/g,'\\$&') + ';P:' + f.password.replace(/[;,:]/g,'\\$&') + ';H:' + (f.hidden ? 'true' : 'false') + ';;';
        case 'email': return 'MATMSG:TO:' + f.email + ';SUB:' + f.subject + ';BODY:' + f.body + ';;';
        case 'phone': return 'tel:' + f.phone;
        case 'sms': return 'SMSTO:' + f.phone + ':' + f.body;
        case 'location': return 'geo:' + f.latitude + ',' + f.longitude;
    }
    return '';
}

function saveHistory(data, record) {
    var items = getHistory();
    items.unshift({
        type: currentType,
        fields: record.fields,
        data: data,
        time: new Date().toLocaleString()
    });
    localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 50)));
    renderHistory();
}

function getHistory() {
    try {
        var items = JSON.parse(localStorage.getItem(historyKey) || '[]');
        return Array.isArray(items) ? items : [];
    } catch (e) {
        return [];
    }
}

function getHistoryTable(item, id) {
    var template = exportTemplates[item.type];
    if (template) {
        return {
            columns: template.columns,
            row: template.getRow(item, id)
        };
    }

    var f = item.fields || {};
    if (item.type === 'wifi') {
        return {columns:['ID','Tên mạng (SSID)','Mật khẩu','Bảo mật','Mạng ẩn'],row:[id,f.ssid || '',f.password || '',f.auth || '',f.hidden ? 'Có' : 'Không']};
    }
    if (item.type === 'location') {
        return {columns:['ID','Latitude','Longitude'],row:[id,f.latitude || '',f.longitude || '']};
    }
    return {columns:['ID','Nội dung'],row:[id,item.data || '']};
}

function renderHistory() {
    var items = getHistory().filter(function(item) { return item.type === currentType; });
    var container = $('#vsHistory');

    if (!items.length) {
        container.html('<div class="vs-history-empty">Chưa có dữ liệu lịch sử cho ' + esc(fields[currentType].title.replace('Tạo QR cho ','')) + '.</div>');
        $('#vsExportExcel').prop('disabled', !getExportTemplate(currentType));
        return;
    }

    var sample = getHistoryTable(items[0], 1);
    var html = '<div class="vs-history-table-wrap"><table class="vs-history-table"><thead><tr>';
    sample.columns.forEach(function(column) { html += '<th>' + esc(column) + '</th>'; });
    html += '</tr></thead><tbody>';

    items.forEach(function(item, index) {
        var table = getHistoryTable(item, index + 1);
        html += '<tr>';
        table.row.forEach(function(value) { html += '<td>' + esc(value) + '</td>'; });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.html(html);
    $('#vsExportExcel').prop('disabled', !exportTemplates[currentType]);
}

function getExportTemplate(type) {
    var normalizedType = String(type || '').toLowerCase().trim();
    return exportTemplates[normalizedType] || null;
}

function exportExcel() {
    var type = String(currentType || '').toLowerCase().trim();
    var template = getExportTemplate(type);
    var status = $('#vsExportStatus');
    var button = $('#vsExportExcel');

    if (!template) {
        status.text('Tab QR hiện tại không có template Excel tương ứng.');
        return;
    }

    var items = getHistory().filter(function(item) {
        return String(item.type || '').toLowerCase().trim() === type &&
            item.fields && typeof item.fields === 'object';
    });

    if (!items.length) {
        status.text('Chưa có dữ liệu để xuất cho ' + template.templateName + '.');
        return;
    }

    if (!window.XLSX || typeof XLSX.utils === 'undefined' || typeof XLSX.writeFile !== 'function') {
        status.text('Thư viện Excel chưa sẵn sàng. Vui lòng tải lại trang.');
        return;
    }

    button.prop('disabled', true).text('Đang xuất...');
    status.text('');

    try {
        var rows = [template.columns];
        items.slice().reverse().forEach(function(item, index) {
            rows.push(template.getRow(item, index + 1));
        });

        var worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!cols'] = template.columns.map(function(column) {
            return {wch: Math.max(16, Math.min(40, String(column).length + 8))};
        });

        var workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, template.templateName.substring(0, 31));
        XLSX.writeFile(workbook, 'QR-Code-' + template.templateName + '.xlsx');

        status.text('✓ Đã xuất ' + items.length + ' bản ghi.');
        track('qr_excel_export', {qr_type:type, template_id:template.templateId, record_count:items.length});
    } catch (e) {
        status.text('Xuất Excel thất bại: ' + (e && e.message ? e.message : 'lỗi không xác định') + '.');
    } finally {
        button.prop('disabled', false).text('Xuất Excel');
    }
}

function setStatus(text) { $('#vsStatus').text(text); }

function generate() {
    var record = getRecord();
    var data = buildData(record);

    if (!data.trim()) { setStatus('Vui lòng nhập nội dung.'); return; }
    if (currentType === 'url' && data.toLowerCase().indexOf('http://') !== 0 && data.toLowerCase().indexOf('https://') !== 0) {
        setStatus('URL nên bắt đầu bằng http:// hoặc https://');
        return;
    }

    var size = parseInt($('#vsSize').val(),10) || 300;
    var level = $('#vsLevel').val() || 'M';
    var encoded = encodeURIComponent(data);
    var imageUrl = 'https://zxing.org/w/chart?cht=qr&chs=' + size + 'x' + size + '&chld=' + level + '&choe=UTF-8&chl=' + encoded;
    var preview = document.getElementById('vsPreview');
    preview.innerHTML = '<div class="vs-empty">Đang tạo QR...</div>';
    setStatus('');

    var image = new Image();
    image.alt = 'QR Code';
    image.onload = function () {
        currentImage = imageUrl;
        preview.innerHTML = '';
        preview.appendChild(image);
        $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',false);
        setStatus('✓ QR Code đã được tạo');
        saveHistory(data, record);
        track('qr_generate',{qr_type:currentType});
    };
    image.onerror = function () {
        currentImage = '';
        preview.innerHTML = '<div class="vs-empty">Không thể tạo QR Code. Vui lòng thử lại.</div>';
        $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',true);
        setStatus('Không thể kết nối dịch vụ tạo QR.');
    };
    image.src = imageUrl;
}

$(function(){
    renderFields('url');
    $('#vsTabs a').click(function(e){e.preventDefault();renderFields($(this).attr('data-type'));});
    $('#vsGenerate').on('click',generate);
    $('#vsClear').on('click',function(){renderFields(currentType);$('#vsStatus').text('');});
    $('#vsExportExcel').on('click',exportExcel);
    $('#vsDownload').on('click',function(){if(!currentImage)return;var a=document.createElement('a');a.href=currentImage;a.download='vietsoft-qr-' + currentType + '.png';a.click();track('qr_download',{qr_type:currentType,format:'png'});});
    $('#vsCopy').on('click',async function(){if(!currentImage)return;try{var blob=await (await fetch(currentImage)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);setStatus('✓ Đã sao chép ảnh QR');track('qr_copy',{qr_type:currentType});}catch(e){setStatus('Trình duyệt không hỗ trợ sao chép ảnh. Hãy dùng Tải PNG.');}});
    $('#vsOpen').on('click',function(){if(currentImage)window.open(currentImage,'_blank');});
});
})();