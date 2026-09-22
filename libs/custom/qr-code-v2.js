(function () {
'use strict';

var currentType = 'url';
var currentData = '';
var currentImage = '';
var historySort = {key:'id', direction:'desc'};
var historyPage = 1;
var historyPageSize = 10;
var historySearch = '';
var historyKey = 'vietsoft_qr_history_v2';
var configKey = 'vietsoft_qr_config_v1';
var qrConfig = {size:300, level:'M'};
var locationMap = null;
var locationMarker = null;

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

function loadQrConfig() {
    try {
        var saved = JSON.parse(localStorage.getItem(configKey) || 'null');
        if (saved && ['220','300','400','500'].indexOf(String(saved.size)) !== -1 && ['L','M','Q','H'].indexOf(String(saved.level)) !== -1) {
            qrConfig = {size:parseInt(saved.size, 10), level:String(saved.level)};
        }
    } catch (e) {}
}

function saveQrConfig() {
    qrConfig.size = parseInt($('#vsSize').val(), 10) || 300;
    qrConfig.level = $('#vsLevel').val() || 'M';
    localStorage.setItem(configKey, JSON.stringify(qrConfig));
}

function applyQrConfig() {
    $('#vsSize').val(String(qrConfig.size));
    $('#vsLevel').val(qrConfig.level);
}

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
    if (locationMap) { locationMap.remove(); locationMap = null; locationMarker = null; }
    renderHistory();
    if (type === 'location') initLocationMap();
    track('qr_type_select', {qr_type:type});
}

function value(id) { return $('#' + id).val() || ''; }

function setLocation(lat, lng, address) {
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    if (!isFinite(lat) || !isFinite(lng)) return;

    $('#vsLat').val(lat.toFixed(6));
    $('#vsLng').val(lng.toFixed(6));
    $('#vsLocationCoords').text(lat.toFixed(6) + ', ' + lng.toFixed(6));
    if (address) $('#vsLocationAddress').text(address);

    var point = [lat, lng];
    if (locationMarker) {
        locationMarker.setLatLng(point);
    } else if (locationMap) {
        locationMarker = L.marker(point, {draggable:true}).addTo(locationMap);
        locationMarker.on('dragend', function () {
            var p = locationMarker.getLatLng();
            setLocation(p.lat, p.lng);
            reverseGeocode(p.lat, p.lng);
        });
    }
    if (locationMap) locationMap.setView(point, Math.max(locationMap.getZoom(), 15));
}

function reverseGeocode(lat, lng) {
    var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng) + '&accept-language=vi';
    fetch(url, {headers:{'Accept':'application/json'}}).then(function(response) {
        if (!response.ok) throw new Error('Reverse geocoding failed');
        return response.json();
    }).then(function(result) {
        if (result && result.display_name) $('#vsLocationAddress').text(result.display_name);
    }).catch(function(){});
}

function searchLocation() {
    var query = value('vsLocationSearch').trim();
    if (!query) return;
    var button = $('#vsLocationSearchButton');
    button.prop('disabled', true).text('Đang tìm...');
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=vi&q=' + encodeURIComponent(query);
    fetch(url, {headers:{'Accept':'application/json'}}).then(function(response) {
        if (!response.ok) throw new Error('Search failed');
        return response.json();
    }).then(function(results) {
        if (!results.length) {
            $('#vsLocationAddress').text('Không tìm thấy địa điểm.');
            return;
        }
        var result = results[0];
        setLocation(result.lat, result.lon, result.display_name);
    }).catch(function() {
        $('#vsLocationAddress').text('Không thể tìm địa điểm lúc này.');
    }).finally(function() {
        button.prop('disabled', false).text('Tìm');
    });
}

function initLocationMap() {
    var element = document.getElementById('vsLocationMap');
    if (!element || typeof L === 'undefined') return;
    locationMap = L.map(element).setView([10.78778, 106.662483], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(locationMap);
    locationMap.on('click', function(e) {
        setLocation(e.latlng.lat, e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    $('#vsLocationSearchButton').on('click', searchLocation);
    $('#vsLocationSearch').on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchLocation();
        }
    });
    setTimeout(function(){ locationMap.invalidateSize(); }, 100);
}

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
        historyId: String(Date.now()) + '-' + String(Math.random()).slice(2),
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
        if (!Array.isArray(items)) return [];

        return items.map(function(item, index) {
            var normalized = item || {};
            if (!normalized.fields || typeof normalized.fields !== 'object') {
                normalized.fields = fieldsFromHistoryData(normalized.type, normalized.data || '');
            }
            if (!normalized.historyId) {
                normalized.historyId = 'legacy-' + index;
            }
            return normalized;
        });
    } catch (e) {
        return [];
    }
}

function fieldsFromHistoryData(type, data) {
    data = String(data || '');

    switch (type) {
        case 'url':
            return {url:data};

        case 'text':
            return {text:data};

        case 'phone':
            return {phone:data.replace(/^tel:/i, '')};

        case 'sms':
            var sms = data.replace(/^smsto:/i, '');
            var smsParts = sms.split(':');
            return {phone:smsParts.shift() || '', body:smsParts.join(':')};

        case 'email':
            return {
                email:(data.match(/TO:([^;]*);/i) || [,''])[1],
                subject:(data.match(/SUB:([^;]*);/i) || [,''])[1],
                body:(data.match(/BODY:(.*?);?$/i) || [,''])[1].replace(/;$/, '')
            };

        case 'contact':
            return {
                name:(data.match(/N:([^;]*);/i) || [,''])[1],
                phone:(data.match(/TEL:([^;]*);/i) || [,''])[1],
                website:(data.match(/URL:([^;]*);/i) || [,''])[1],
                email:(data.match(/EMAIL:([^;]*);/i) || [,''])[1],
                address:(data.match(/ADR:([^;]*);/i) || [,''])[1]
            };

        case 'wifi':
            return {
                ssid:(data.match(/S:([^;]*);/i) || [,''])[1],
                password:(data.match(/P:([^;]*);/i) || [,''])[1],
                auth:(data.match(/T:([^;]*);/i) || [,''])[1],
                hidden:((data.match(/H:([^;]*);/i) || [,'false'])[1]).toLowerCase() === 'true'
            };

        case 'location':
            var geo = data.replace(/^geo:/i, '').split(',');
            return {latitude:geo[0] || '',longitude:geo[1] || ''};
    }

    return {};
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

function getHistoryViewItems() {
    var items = getHistory().filter(function(item) { return item.type === currentType; });

    if (historySearch) {
        var query = historySearch.toLowerCase();
        items = items.filter(function(item) {
            var table = getHistoryTable(item, 0);
            return table.row.some(function(value) {
                return String(value == null ? '' : value).toLowerCase().indexOf(query) !== -1;
            });
        });
    }

    items.sort(function(a, b) {
        var av = historySortValue(a, historySort.key);
        var bv = historySortValue(b, historySort.key);
        var result = av < bv ? -1 : (av > bv ? 1 : 0);
        return historySort.direction === 'asc' ? result : -result;
    });

    return items;
}

function historySortValue(item, key) {
    if (key === 'time') return String(item.time || '');
    if (key === 'id') return 0;
    var table = getHistoryTable(item, 0);
    var index = exportTemplates[currentType] ? exportTemplates[currentType].columns.indexOf(key) : -1;
    return index >= 0 ? String(table.row[index] == null ? '' : table.row[index]).toLowerCase() : '';
}

function renderHistory() {
    var allItems = getHistoryViewItems();
    var container = $('#vsHistory');
    var template = getExportTemplate(currentType);

    var toolbar = '<div class="vs-history-toolbar">' +
        '<input class="vs-history-search" id="vsHistorySearch" value="' + esc(historySearch) + '" placeholder="Lọc dữ liệu..." aria-label="Lọc lịch sử">' +
        '<div class="vs-history-toolbar-actions">' +
        '<button class="vs-btn vs-btn-secondary" id="vsClearHistory" type="button"' + (!allItems.length ? ' disabled' : '') + '>Xóa tất cả</button>' +
        '</div></div>';

    if (!allItems.length) {
        container.html(toolbar + '<div class="vs-history-empty">' +
            (historySearch ? 'Không tìm thấy dữ liệu phù hợp.' : 'Chưa có dữ liệu lịch sử cho ' + esc(fields[currentType].title.replace('Tạo QR cho ','')) + '.') +
            '</div>');
        $('#vsExportExcel').prop('disabled', !template);
        return;
    }

    var pageCount = Math.max(1, Math.ceil(allItems.length / historyPageSize));
    if (historyPage > pageCount) historyPage = pageCount;
    var start = (historyPage - 1) * historyPageSize;
    var pageItems = allItems.slice(start, start + historyPageSize);
    var columns = template ? template.columns.slice() : getHistoryTable(allItems[0], 1).columns.slice();

    var html = toolbar +
        '<div class="vs-history-table-wrap"><table class="vs-history-table"><thead><tr>';

    columns.forEach(function(column) {
        var sortable = column !== 'ID';
        var arrow = sortable && historySort.key === column ? (historySort.direction === 'asc' ? ' ▲' : ' ▼') : '';
        html += '<th data-sortable="' + sortable + '" data-history-sort="' + esc(column) + '">' + esc(column) + arrow + '</th>';
    });
    html += '<th data-sortable="false">Thao tác</th></tr></thead><tbody>';

    pageItems.forEach(function(item, index) {
        var absoluteIndex = start + index;
        var table = getHistoryTable(item, absoluteIndex + 1);
        html += '<tr>';
        table.row.forEach(function(value) { html += '<td>' + esc(value) + '</td>'; });
        html += '<td class="vs-history-actions"><button class="vs-history-delete" type="button" data-history-delete-id="' + esc(item.historyId) + '" title="Xóa" aria-label="Xóa bản ghi">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2h-2v13H6V7H4V5h4l1-2zm-1 4v11h8V7H8zm2 2h2v7h-2V9zm4 0h2v7h-2V9z"/></svg>' +
            '</button></td></tr>';
    });

    html += '</tbody></table></div>';

    var first = start + 1;
    var last = Math.min(start + historyPageSize, allItems.length);
    html += '<div class="vs-history-footer"><div class="vs-history-page-size-wrap"><span>Hiển thị</span><select class="vs-history-page-size" id="vsHistoryPageSize"><option value="10">10 / trang</option><option value="25">25 / trang</option><option value="50">50 / trang</option></select></div><div class="vs-history-pagination"><span>' + first + '–' + last + ' / ' + allItems.length + '</span><div class="vs-history-page-buttons">';
    html += '<button type="button" data-history-page="' + (historyPage - 1) + '"' + (historyPage === 1 ? ' disabled' : '') + '>‹</button>';
    for (var page = 1; page <= pageCount; page++) {
        if (pageCount > 7 && page !== 1 && page !== pageCount && Math.abs(page - historyPage) > 2) continue;
        html += '<button type="button" class="' + (page === historyPage ? 'active' : '') + '" data-history-page="' + page + '">' + page + '</button>';
    }
    html += '<button type="button" data-history-page="' + (historyPage + 1) + '"' + (historyPage === pageCount ? ' disabled' : '') + '>›</button></div></div></div>';

    var searchInput = document.getElementById('vsHistorySearch');
    var hadSearchFocus = document.activeElement === searchInput;
    var searchSelectionStart = searchInput ? searchInput.selectionStart : null;
    var searchSelectionEnd = searchInput ? searchInput.selectionEnd : null;
    container.html(html);
    $('#vsHistoryPageSize').val(String(historyPageSize));
    if (hadSearchFocus) {
        var restoredSearch = document.getElementById('vsHistorySearch');
        if (restoredSearch) {
            restoredSearch.focus();
            try { restoredSearch.setSelectionRange(searchSelectionStart, searchSelectionEnd); } catch (e) {}
        }
    }
    $('#vsExportExcel').prop('disabled', !template);
}

function deleteHistoryItem(historyId) {
    var items = getHistory();
    var targetIndex = -1;

    for (var i = 0; i < items.length; i++) {
        if (String(items[i].historyId || '') === String(historyId || '')) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex < 0) return;
    items.splice(targetIndex, 1);
    localStorage.setItem(historyKey, JSON.stringify(items));
    renderHistory();
}

function clearCurrentHistory() {
    if (!confirm('Xóa toàn bộ lịch sử của loại QR này?')) return;
    var items = getHistory().filter(function(item) { return item.type !== currentType; });
    localStorage.setItem(historyKey, JSON.stringify(items));
    historyPage = 1;
    renderHistory();
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

    saveQrConfig();
    var size = qrConfig.size;
    var level = qrConfig.level;
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
    loadQrConfig();
    applyQrConfig();
    renderFields('url');
    $('#vsTabs a').click(function(e){e.preventDefault();renderFields($(this).attr('data-type'));});
    $('#vsGenerate').on('click',generate);
    $('#vsClear').on('click',function(){renderFields(currentType);$('#vsStatus').text('');});
    $('#vsExportExcel').on('click',exportExcel);
    $('#vsSize,#vsLevel').on('change', saveQrConfig);
    $('#vsHistory').on('input', '#vsHistorySearch', function(){
        historySearch = $(this).val();
        historyPage = 1;
        renderHistory();
    });
    $('#vsHistory').on('change', '#vsHistoryPageSize', function(){
        historyPageSize = parseInt($(this).val(), 10) || 10;
        historyPage = 1;
        renderHistory();
    });
    $('#vsHistory').on('click', '[data-history-sort]', function(){
        var key = $(this).attr('data-history-sort');
        if (key === 'ID') return;
        if (historySort.key === key) historySort.direction = historySort.direction === 'asc' ? 'desc' : 'asc';
        else { historySort.key = key; historySort.direction = 'asc'; }
        historyPage = 1;
        renderHistory();
    });
    $('#vsHistory').on('click', '[data-history-page]', function(){
        var page = parseInt($(this).attr('data-history-page'), 10);
        if (page > 0) { historyPage = page; renderHistory(); }
    });
    $('#vsHistory').on('click', '[data-history-delete-id]', function(){
        var historyId = $(this).attr('data-history-delete-id');
        if (confirm('Xóa bản ghi này?')) deleteHistoryItem(historyId);
    });
    $('#vsHistory').on('click', '#vsClearHistory', clearCurrentHistory);
    $('#vsDownload').on('click',function(){if(!currentImage)return;var a=document.createElement('a');a.href=currentImage;a.download='vietsoft-qr-' + currentType + '.png';a.click();track('qr_download',{qr_type:currentType,format:'png'});});
    $('#vsCopy').on('click',async function(){if(!currentImage)return;try{var blob=await (await fetch(currentImage)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);setStatus('✓ Đã sao chép ảnh QR');track('qr_copy',{qr_type:currentType});}catch(e){setStatus('Trình duyệt không hỗ trợ sao chép ảnh. Hãy dùng Tải PNG.');}});
    $('#vsOpen').on('click',function(){if(currentImage)window.open(currentImage,'_blank');});
});
})();