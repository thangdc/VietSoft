(function () {
'use strict';

var currentType = 'url';
var currentData = '';
var currentImage = '';
var currentHistoryId = '';
var historySort = {key:'id', direction:'desc'};
var historyPage = 1;
var historyPageSize = 10;
var historySearch = '';
var historyKey = 'vietsoft_qr_history_v2';
var configKey = 'vietsoft_qr_config_v1';
var activeTabKey = 'vietsoft_qr_active_tab_v1';
var currentQrKey = 'vietsoft_qr_current_v1';
var qrConfig = {size:300, level:'M'};
var designMode = false;
var currentDesign = {foreground:'#111827', background:'#FFFFFF', style:'square', logoDataUrl:''};
var locationMap = null;
var locationMarker = null;
var locationTileLayer = null;
var locationTileLayerIndex = 0;
var locationTileLayerErrors = 0;
var locationTileLayers = [
    {url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'&copy; OpenStreetMap contributors'},
    {url:'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',attribution:'&copy; OpenStreetMap contributors, Tiles style by HOT'},
    {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',attribution:'Sources: Esri, DeLorme, HERE, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'}
];

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
    location: {title:'Tạo QR cho vị trí', html:'<div class="vs-location-search"><input id="vsLocationSearch" type="search" placeholder="Tìm địa chỉ hoặc địa điểm..." aria-label="Tìm địa chỉ hoặc địa điểm"><button class="vs-btn vs-btn-secondary" id="vsLocationSearchButton" type="button">Tìm</button></div><div id="vsLocationMap" class="vs-location-map"></div><div class="vs-location-selected"><span id="vsLocationAddress">Chọn một điểm trên bản đồ</span><span id="vsLocationCoords">10.787780, 106.662483</span></div><input id="vsLat" type="hidden" value="10.78778"><input id="vsLng" type="hidden" value="106.662483"><p class="vs-location-help">Nhấp vào bản đồ hoặc kéo ghim để chọn vị trí. Có thể tìm địa chỉ ở ô phía trên.</p>'}
};


function renderDesignLegacy() {
    designMode = true;
    currentType = 'design';
    historyPage = 1;
    historySearch = '';


    $('#vsFields').html('<div class="vs-design-panel">' +
        '<div class="vs-design-intro">Tùy chỉnh màu sắc, kiểu điểm và logo. QR vẫn giữ vùng nhận diện cần thiết để dễ quét.</div>' +
        '<div class="vs-grid2">' +
        '<div class="vs-field"><label>Màu QR</label><div class="vs-color-control"><input id="vsDesignForeground" type="color" value="#111827"><input id="vsDesignForegroundText" type="text" value="#111827" maxlength="7" aria-label="Mã màu QR"></div></div>' +
        '<div class="vs-field"><label>Màu nền</label><div class="vs-color-control"><input id="vsDesignBackground" type="color" value="#FFFFFF"><input id="vsDesignBackgroundText" type="text" value="#FFFFFF" maxlength="7" aria-label="Mã màu nền"></div></div>' +
        '</div>' +
        '<div class="vs-field"><label>Kiểu điểm</label><select id="vsDesignStyle"><option value="square">Vuông</option><option value="rounded">Bo góc</option><option value="dot">Chấm</option></select></div>' +
        '<div class="vs-field"><label>Logo <span class="vs-label-muted">(tùy chọn)</span></label><input id="vsDesignLogo" type="file" accept="image/png,image/jpeg,image/webp"><div id="vsDesignLogoName" class="vs-design-file-name">Chưa chọn logo</div></div>' +
        '<div class="vs-design-warning" id="vsDesignWarning">Tạo QR trước, sau đó bạn có thể áp dụng thiết kế.</div>' +
        '<div class="vs-actions"><button class="vs-btn vs-btn-primary" id="vsApplyDesign" type="button" disabled><svg class="vs-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1L12 3z"/></svg><span>Áp dụng thiết kế</span></button><button class="vs-btn vs-btn-secondary" id="vsResetDesign" type="button">Đặt lại</button></div>' +
        '</div>');
    syncDesignColorControls();
    $('#vsApplyDesign').prop('disabled', !currentData);
    $('#vsDesignWarning').text(currentData ? '✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.' : 'Tạo QR trước, sau đó bạn có thể áp dụng thiết kế.');
    $('#vsHistory').empty();
    if (locationMap) { locationMap.remove(); locationMap = null; locationMarker = null; }
}

function renderResultDesignPanel() {
    var container = $('.vs-result');
    if (!container.length || $('#vsResultDesign').length) return;
    var html = '<div class="vs-result-design" id="vsResultDesign">' +
        '<div class="vs-result-design-header"><div><div class="vs-result-design-kicker">Tùy chỉnh</div><h3>Thiết kế QR</h3></div><span class="vs-result-design-hint">Thay đổi sẽ cập nhật ngay</span></div>' +
        '<div class="vs-grid2">' +
        '<div class="vs-field"><label>Màu QR</label><div class="vs-color-control"><input id="vsDesignForeground" type="color" value="#111827"><input id="vsDesignForegroundText" type="text" value="#111827" maxlength="7" aria-label="Mã màu QR"></div></div>' +
        '<div class="vs-field"><label>Màu nền</label><div class="vs-color-control"><input id="vsDesignBackground" type="color" value="#FFFFFF"><input id="vsDesignBackgroundText" type="text" value="#FFFFFF" maxlength="7" aria-label="Mã màu nền"></div></div>' +
        '</div>' +
        '<div class="vs-field"><label>Kiểu điểm</label><select id="vsDesignStyle"><option value="square">Vuông</option><option value="rounded">Bo góc</option><option value="dot">Chấm</option></select></div>' +
        '<div class="vs-field"><label>Logo <span class="vs-label-muted">(tùy chọn)</span></label><input id="vsDesignLogo" type="file" accept="image/png,image/jpeg,image/webp"><div id="vsDesignLogoName" class="vs-design-file-name">Chưa chọn logo</div></div>' +
        '<div class="vs-design-warning" id="vsDesignWarning">Tạo QR trước, sau đó bạn có thể tùy chỉnh.</div>' +
        '<div class="vs-actions"><button class="vs-btn vs-btn-primary" id="vsApplyDesign" type="button" disabled><svg class="vs-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1L12 3z"/></svg><span>Áp dụng thiết kế</span></button><button class="vs-btn vs-btn-secondary" id="vsResetDesign" type="button">Đặt lại</button></div>' +
        '</div>';
    container.find('.vs-result-config').after(html);
    syncDesignColorControls();
    syncDesignFields(currentDesign);
    $('#vsApplyDesign').prop('disabled', !currentData);
    $('#vsDesignWarning').text(currentData ? '✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.' : 'Tạo QR trước, sau đó bạn có thể tùy chỉnh.');
}

function syncDesignColorControls() {
    $('#vsDesignForeground').on('input', function(){ $('#vsDesignForegroundText').val($(this).val()); if (currentData) renderCustomQr(); });
    $('#vsDesignBackground').on('input', function(){ $('#vsDesignBackgroundText').val($(this).val()); if (currentData) renderCustomQr(); });
    $('#vsDesignForegroundText,#vsDesignBackgroundText').on('change', function(){
        var valueText = $(this).val().trim();
        if (/^#[0-9a-fA-F]{6}$/.test(valueText)) {
            var target = this.id === 'vsDesignForegroundText' ? '#vsDesignForeground' : '#vsDesignBackground';
            $(target).val(valueText).trigger('input');
        }
    });
    $('#vsDesignStyle').on('change', function(){ if (currentData) renderCustomQr(); });
    $('#vsDesignLogo').on('change', function(){
        var file = this.files && this.files[0];
        $('#vsDesignLogoName').text(file ? file.name : 'Chưa chọn logo');
        if (currentData) renderCustomQr();
    });
    $('#vsApplyDesign').on('click', applyDesign);
    $('#vsResetDesign').on('click', function(){
        $('#vsDesignForeground').val('#111827').trigger('input');
        $('#vsDesignBackground').val('#FFFFFF').trigger('input');
        $('#vsDesignStyle').val('square');
        $('#vsDesignLogo').val('');
        $('#vsDesignLogoName').text('Chưa chọn logo');
        if (currentData) renderCustomQr();
        currentDesign = {foreground:'#111827', background:'#FFFFFF', style:'square', logoDataUrl:''};
    });
}

function drawRoundedRect(ctx, x, y, size, radius) {
    var r = Math.min(radius, size / 2);
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+size,y,x+size,y+size,r); ctx.arcTo(x+size,y+size,x,y+size,r); ctx.arcTo(x,y+size,x,y,r); ctx.arcTo(x,y,x+size,y,r); ctx.closePath(); ctx.fill();
}

function isFinderModule(row, col, count) {
    return (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);
}

function drawFinder(ctx, x, y, moduleSize, foreground, background) {
    ctx.fillStyle = foreground; ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);
    ctx.fillStyle = background; ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);
    ctx.fillStyle = foreground; ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
}

function renderQrImage(data, design, size, callback, onError) {
    if (!data || typeof qrcode !== 'function') return false;
    onError = onError || function() {};
    design = normalizeDesign(design);
    var level = qrConfig.level || 'M';
    var qr;
    try {
        qr = qrcode(0, level);
        qr.addData(data);
        qr.make();
    } catch (e) {
        onError(e);
        return false;
    }
    var count = qr.getModuleCount();
    var canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');
    var foreground = design.foreground, background = design.background, style = design.style;
    ctx.fillStyle = background; ctx.fillRect(0, 0, size, size);
    var quiet = 4, total = count + quiet * 2, moduleSize = size / total, offset = quiet * moduleSize;
    for (var row=0; row<count; row++) for (var col=0; col<count; col++) {
        if (!qr.isDark(row,col) || isFinderModule(row,col,count)) continue;
        var x=offset+col*moduleSize, y=offset+row*moduleSize;
        ctx.fillStyle=foreground;
        if (style === 'dot') { ctx.beginPath(); ctx.arc(x+moduleSize/2,y+moduleSize/2,moduleSize*.42,0,Math.PI*2); ctx.fill(); }
        else if (style === 'rounded') drawRoundedRect(ctx,x+moduleSize*.08,y+moduleSize*.08,moduleSize*.84,moduleSize*.25);
        else ctx.fillRect(x,y,Math.ceil(moduleSize+.1),Math.ceil(moduleSize+.1));
    }
    drawFinder(ctx, offset, offset, moduleSize, foreground, background);
    drawFinder(ctx, offset + (count-7)*moduleSize, offset, moduleSize, foreground, background);
    drawFinder(ctx, offset, offset + (count-7)*moduleSize, moduleSize, foreground, background);
    var done = function(logo){
        if (logo) {
            var logoSize=size*.18, lx=(size-logoSize)/2, ly=(size-logoSize)/2;
            ctx.fillStyle=background; ctx.fillRect(lx-8,ly-8,logoSize+16,logoSize+16);
            ctx.drawImage(logo,lx,ly,logoSize,logoSize);
        }
        callback(canvas.toDataURL('image/png'));
    };
    if (design.logoDataUrl) {
        var logo=new Image();
        logo.onload=function(){done(logo);};
        logo.onerror=function(){done(null);};
        logo.src=design.logoDataUrl;
    } else done(null);
    return true;
}

function renderCustomQr() {
    if (!currentData) return false;
    var design = normalizeDesign({
        foreground: $('#vsDesignForeground').val(),
        background: $('#vsDesignBackground').val(),
        style: $('#vsDesignStyle').val()
    });
    getCurrentDesign(function(captured) {
        currentDesign = captured;
        renderQrImage(currentData, captured, qrConfig.size || 300, function(imageUrl) {
            currentImage = imageUrl;
            var preview=document.getElementById('vsPreview'); preview.innerHTML='';
            var img=new Image(); img.alt='QR Code'; img.src=currentImage; preview.appendChild(img);
            $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',false);
            saveCurrentQrState();
            setStatus('✓ Thiết kế QR đã được áp dụng');
        });
    });
    return true;
}
function applyDesign() {
    getCurrentDesign(function(design) {
        currentDesign = design;
        renderQrImage(currentData, design, qrConfig.size || 300, function(imageUrl) {
            currentImage = imageUrl;
            var preview=document.getElementById('vsPreview'); preview.innerHTML='';
            var img=new Image(); img.alt='QR Code'; img.src=currentImage; preview.appendChild(img);
            $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',false);
            persistCurrentDesign(design);
            saveCurrentQrState();
            setStatus('✓ Thiết kế QR đã được áp dụng và lưu');
        });
    });
}

function renderFields(type) {
    currentType = type;
    designMode = false;
    historySearch = '';
    historyPage = 1;
    historySort = {key:'id', direction:'desc'};
    $('#vsGenerate').closest('.vs-actions').show();
    $('#vsResultDesign').show();
    $('.vs-history').show();
    $('#vsFormTitle').text(fields[type].title);
    $('#vsFields').html(fields[type].html);
    $('#vsStatus').text('');
    $('#vsTabs a').removeClass('active').filter('[data-type="' + type + '"]').addClass('active');
    if (locationMap) { locationMap.remove(); locationMap = null; locationMarker = null; }
    renderHistory();
    if (type === 'location') initLocationMap();
    if ($('#vsResultDesign').length) {
        syncDesignFields(currentDesign);
        $('#vsApplyDesign').prop('disabled', !currentData);
        $('#vsDesignWarning').text(currentData ? '✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.' : 'Tạo QR trước, sau đó bạn có thể tùy chỉnh.');
    }
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

function addLocationTileLayer() {
    if (!locationMap || typeof L === 'undefined') return;
    if (locationTileLayer) { locationMap.removeLayer(locationTileLayer); locationTileLayer = null; }
    var config = locationTileLayers[locationTileLayerIndex];
    if (!config) return;
    locationTileLayerErrors = 0;
    locationTileLayer = L.tileLayer(config.url, {maxZoom:19,crossOrigin:true,attribution:config.attribution});
    locationTileLayer.on('tileerror', function () {
        locationTileLayerErrors += 1;
        if (locationTileLayerErrors >= 3 && locationTileLayerIndex < locationTileLayers.length - 1) {
            locationTileLayerIndex += 1; addLocationTileLayer();
        }
    });
    locationTileLayer.addTo(locationMap);
}

function initLocationMap() {
    var element = document.getElementById('vsLocationMap');
    if (!element || typeof L === 'undefined') return;
    locationTileLayerIndex = 0;
    locationMap = L.map(element, {preferCanvas:true}).setView([10.78778, 106.662483], 13);
    addLocationTileLayer();
    locationMap.on('click', function(e) { setLocation(e.latlng.lat, e.latlng.lng); reverseGeocode(e.latlng.lat, e.latlng.lng); });
    $('#vsLocationSearchButton').on('click', searchLocation);
    $('#vsLocationSearch').on('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } });
    function refreshLocationMap() {
        if (!locationMap) return;
        locationMap.invalidateSize(true);
        if (locationTileLayer) locationTileLayer.redraw();
    }
    setTimeout(refreshLocationMap,100); setTimeout(refreshLocationMap,500); setTimeout(refreshLocationMap,1000);
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
    var historyId = String(Date.now()) + '-' + String(Math.random()).slice(2);
    items.unshift({
        historyId: historyId,
        type: currentType,
        fields: record.fields,
        data: data,
        design: $.extend({}, currentDesign),
        time: new Date().toLocaleString()
    });
    currentHistoryId = historyId;
    localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 50)));
    renderHistory();
}

function normalizeDesign(design) {
    design = design || {};
    return {
        foreground: /^#[0-9a-fA-F]{6}$/.test(String(design.foreground || '')) ? String(design.foreground) : '#111827',
        background: /^#[0-9a-fA-F]{6}$/.test(String(design.background || '')) ? String(design.background) : '#FFFFFF',
        style: ['square','rounded','dot'].indexOf(String(design.style || '')) !== -1 ? String(design.style) : 'square',
        logoDataUrl: String(design.logoDataUrl || '')
    };
}

function getCurrentDesign(callback) {
    var design = {
        foreground: $('#vsDesignForeground').val() || '#111827',
        background: $('#vsDesignBackground').val() || '#FFFFFF',
        style: $('#vsDesignStyle').val() || 'square',
        logoDataUrl: ''
    };
    var file = document.getElementById('vsDesignLogo');
    var logoFile = file && file.files && file.files[0];
    if (!logoFile) {
        callback(normalizeDesign(design));
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        design.logoDataUrl = e.target.result || '';
        callback(normalizeDesign(design));
    };
    reader.onerror = function() { callback(normalizeDesign(design)); };
    reader.readAsDataURL(logoFile);
}

function saveCurrentQrState() {
    if (!currentData) return;
    try {
        localStorage.setItem(currentQrKey, JSON.stringify({data:currentData, design:normalizeDesign(currentDesign), type:currentType, historyId:currentHistoryId}));
    } catch (e) {}
}

function restoreCurrentQrState() {
    try {
        var saved = JSON.parse(localStorage.getItem(currentQrKey) || 'null');
        if (!saved || !saved.data) return;
        currentData = String(saved.data);
        currentType = String(saved.type || currentType);
        currentHistoryId = String(saved.historyId || '');
        currentDesign = normalizeDesign(saved.design);
        renderQrImage(currentData, currentDesign, qrConfig.size || 300, function(imageUrl) {
            currentImage = imageUrl;
            var preview = document.getElementById('vsPreview');
            if (!preview) return;
            preview.innerHTML = '';
            var img = new Image();
            img.alt = 'QR Code';
            img.src = currentImage;
            preview.appendChild(img);
            $('#vsDownload,#vsCopy,#vsOpen').prop('disabled', false);
            syncDesignFields(currentDesign);
            $('#vsApplyDesign').prop('disabled', false);
            $('#vsDesignWarning').text('✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.');
        });
    } catch (e) {}
}

function persistCurrentDesign(design) {
    currentDesign = normalizeDesign(design);
    if (!currentData || !currentHistoryId) return;
    var items = getHistory();
    for (var i = 0; i < items.length; i++) {
        if (String(items[i].historyId || '') === String(currentHistoryId)) {
            items[i].design = $.extend({}, currentDesign);
            localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 50)));
            break;
        }
    }
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
            normalized.design = normalizeDesign(normalized.design);
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

function ensureHistoryQrModal() {
    if ($('#vsHistoryQrModal').length) return;
    $('body').append('<div id="vsHistoryQrModal" class="vs-history-qr-modal" role="dialog" aria-modal="true" aria-label="QR Code preview"><div class="vs-history-qr-modal-backdrop"></div><div class="vs-history-qr-modal-content"><button type="button" class="vs-history-qr-modal-close" aria-label="Đóng">×</button><div class="vs-history-qr-modal-image"></div></div></div>');
    $(document).on('click','.vs-history-qr-modal-backdrop,.vs-history-qr-modal-close',closeHistoryQrModal);
    $(document).on('keydown',function(e){if(e.key==='Escape')closeHistoryQrModal();});
}
function openHistoryQrModal(imageUrl){if(!imageUrl)return;ensureHistoryQrModal();$('#vsHistoryQrModal .vs-history-qr-modal-image').html('<img src="'+esc(imageUrl)+'" alt="QR Code preview">');$('#vsHistoryQrModal').addClass('is-open');$('body').addClass('vs-history-qr-modal-open');}
function openHistoryQrModalFromData(data){
    if(!data)return;
    ensureHistoryQrModal();
    var container=$('<div></div>').css({position:'absolute',left:'-99999px',top:'-99999px',width:'360px',height:'360px'}).appendTo('body');
    try{
        var level=(window.QRCode.CorrectLevel||{}).M;
        new window.QRCode(container[0],{text:data,width:360,height:360,correctLevel:level});
        setTimeout(function(){
            var canvas=container.find('canvas')[0], image=container.find('img')[0], imageUrl=canvas?canvas.toDataURL('image/png'):(image?image.src:'');
            container.remove();
            openHistoryQrModal(imageUrl);
        },0);
    }catch(e){container.remove();}
}
function closeHistoryQrModal(){$('#vsHistoryQrModal').removeClass('is-open');$('body').removeClass('vs-history-qr-modal-open');}
function populateFieldsFromHistory(item) {
    if (!item || !item.type) return;
    var type = String(item.type);
    if (!fields[type]) return;
    renderFields(type);
    var values = item.fields || fieldsFromHistoryData(type, item.data || '');
    var map = {
        url: {url:'vsUrl'},
        text: {text:'vsText'},
        contact: {name:'vsName',phone:'vsPhone',email:'vsEmail',website:'vsWebsite',address:'vsAddress'},
        wifi: {ssid:'vsSsid',password:'vsWifiPass',auth:'vsWifiAuth',hidden:'vsHidden'},
        email: {email:'vsEmailTo',subject:'vsEmailSubject',body:'vsEmailBody'},
        phone: {phone:'vsPhoneNumber'},
        sms: {phone:'vsSmsPhone',body:'vsSmsBody'},
        location: {latitude:'vsLat',longitude:'vsLng'}
    };
    var typeMap = map[type] || {};
    Object.keys(typeMap).forEach(function(key) {
        var selector = '#' + typeMap[key];
        if ($(selector).length) {
            if ($(selector).is(':checkbox')) $(selector).prop('checked', !!values[key]);
            else $(selector).val(values[key] == null ? '' : values[key]);
        }
    });
    if (type === 'location') {
        var lat = values.latitude || '';
        var lng = values.longitude || '';
        if (lat && lng) setLocation(lat, lng);
    }
}
function syncDesignFields(design) {
    design = normalizeDesign(design);
    $('#vsDesignForeground').val(design.foreground);
    $('#vsDesignForegroundText').val(design.foreground);
    $('#vsDesignBackground').val(design.background);
    $('#vsDesignBackgroundText').val(design.background);
    $('#vsDesignStyle').val(design.style);
    $('#vsDesignLogoName').text(design.logoDataUrl ? 'Logo đã lưu' : 'Chưa chọn logo');
}
function showHistoryQrResult(item) {
    if (!item || !item.data) return;
    var design = normalizeDesign(item.design);
    currentHistoryId = String(item.historyId || '');
    populateFieldsFromHistory(item);
    syncDesignFields(design);
    currentData = String(item.data);
    currentDesign = design;
    renderQrImage(currentData, design, qrConfig.size || 300, function(imageUrl) {
        currentImage = imageUrl;
        var preview=document.getElementById('vsPreview'); preview.innerHTML='';
        var img=new Image(); img.alt='QR Code'; img.src=currentImage; preview.appendChild(img);
        $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',false);
        $('#vsApplyDesign').prop('disabled', false);
        $('#vsDesignWarning').text('✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.');
        saveCurrentQrState();
        setStatus('✓ Đã tải QR từ lịch sử; bạn có thể chỉnh sửa nội dung và tạo lại.');
        try {
            var form = document.querySelector('.vs-form');
            if (form) form.scrollIntoView({behavior:'smooth', block:'start'});
        } catch (e) {}
    });
}

$(document).on('click','.vs-history-qr-trigger',function(e){
    e.preventDefault();
    e.stopPropagation();
    var historyId=$(this).attr('data-history-id')||'';
    var items=getHistory();
    for(var i=0;i<items.length;i++) {
        if(String(items[i].historyId||'')===historyId) { showHistoryQrResult(items[i]); break; }
    }
});
$(document).on('click','.vs-history-row',function(e){
    if ($(e.target).closest('.vs-history-delete,.vs-history-qr-trigger,button,a,input,select,textarea').length) return;
    var historyId=$(this).attr('data-history-id')||'';
    var items=getHistory();
    for(var i=0;i<items.length;i++) {
        if(String(items[i].historyId||'')===historyId) { showHistoryQrResult(items[i]); break; }
    }
});
function renderHistoryQrs(){
    $('.vs-history-qr-code').each(function(){
        var element=this, historyId=$(element).attr('data-history-id')||'', items=getHistory(), item=null;
        for(var i=0;i<items.length;i++) if(String(items[i].historyId||'')===historyId){item=items[i];break;}
        if(!item || !item.data) return;
        renderQrImage(String(item.data), normalizeDesign(item.design), 56, function(imageUrl){
            $(element).empty().append($('<img>', {src:imageUrl, alt:'QR Code'}));
        });
    });
}
function renderHistory() {
    var allItems = getHistoryViewItems();
    var container = $('#vsHistory');
    var template = getExportTemplate(currentType);

    var toolbar = '<div class="vs-history-toolbar">' +
        '<input class="vs-history-search" id="vsHistorySearch" value="' + esc(historySearch) + '" placeholder="Lọc dữ liệu..." aria-label="Lọc lịch sử">' +
        '<div class="vs-history-toolbar-actions">' +
        '<button class="vs-btn vs-btn-secondary" id="vsClearHistory" type="button"' + (!allItems.length ? ' disabled' : '') + '><svg class="vs-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l1 2h3v2H3V6h3l1-2zm0 6h2v9h2v-9h2v9h2v-9h2v11H7V10z"/></svg><span>Xóa tất cả</span></button>' +
        '</div></div>';

    if (!allItems.length) {
        container.html(toolbar + '<div class="vs-history-empty">' +
            (historySearch ? 'Không tìm thấy dữ liệu phù hợp.' : 'Chưa có dữ liệu lịch sử cho ' + esc((fields[currentType] ? fields[currentType].title : 'loại QR hiện tại').replace('Tạo QR cho ','')) + '.') +
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

    html += '<th class="vs-history-qr-column" data-sortable="false">QR</th>';
    columns.forEach(function(column) {
        var sortable = column !== 'ID';
        var arrow = sortable && historySort.key === column ? (historySort.direction === 'asc' ? ' ▲' : ' ▼') : '';
        html += '<th class="' + (column === 'ID' ? 'vs-history-id-column' : '') + '" data-sortable="' + sortable + '" data-history-sort="' + esc(column) + '">' + esc(column) + arrow + '</th>';
    });
    html += '<th class="vs-history-actions-column" data-sortable="false">Thao tác</th></tr></thead><tbody>';

    pageItems.forEach(function(item, index) {
        var absoluteIndex = start + index;
        var table = getHistoryTable(item, absoluteIndex + 1);
        html += '<tr class="vs-history-row" data-history-id="' + esc(item.historyId) + '" title="Nhấn để chỉnh sửa QR này">';
        html += '<td class="vs-history-qr"><a href="#" class="vs-history-qr-trigger" data-history-id="' + esc(item.historyId) + '" title="Xem QR Code"><div class="vs-history-qr-code" data-history-id="' + esc(item.historyId) + '" aria-label="QR Code"></div></a></td>';
        table.row.forEach(function(value, cellIndex) { html += '<td class="' + (cellIndex === 0 ? 'vs-history-id' : '') + '">' + esc(value) + '</td>'; });
        html += '<td class="vs-history-actions"><button class="vs-history-delete" type="button" data-history-delete-id="' + esc(item.historyId) + '" title="Xóa" aria-label="Xóa bản ghi">' +
            '<svg class="vs-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2h-2v13H6V7H4V5h4l1-2zm-1 4v11h8V7H8zm2 2h2v7h-2V9zm4 0h2v7h-2V9z"/></svg>' +
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
    var hadSearchFocus = searchInput && (
        document.activeElement === searchInput ||
        document.activeElement === document.body
    );
    var searchSelectionStart = searchInput ? searchInput.selectionStart : null;
    var searchSelectionEnd = searchInput ? searchInput.selectionEnd : null;
    container.html(html);
    $('#vsHistoryPageSize').val(String(historyPageSize));
    if (hadSearchFocus) {
        setTimeout(function () {
            var restoredSearch = document.getElementById('vsHistorySearch');
            if (!restoredSearch) return;
            restoredSearch.focus();
            try {
                restoredSearch.setSelectionRange(
                    searchSelectionStart == null ? restoredSearch.value.length : searchSelectionStart,
                    searchSelectionEnd == null ? restoredSearch.value.length : searchSelectionEnd
                );
            } catch (e) {}
        }, 0);
    }
    $('#vsExportExcel').prop('disabled', !template);
    renderHistoryQrs();
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
    if (String(currentHistoryId || '') === String(historyId || '')) {
        currentHistoryId = '';
    }
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
    var data;
    try {
        data = buildData(record);
    } catch (e) {
        setStatus('Không thể tạo dữ liệu QR. Vui lòng kiểm tra lại nội dung.');
        return;
    }

    if (!data.trim()) { setStatus('Vui lòng nhập nội dung.'); return; }
    if (currentType === 'url' && data.toLowerCase().indexOf('http://') !== 0 && data.toLowerCase().indexOf('https://') !== 0) {
        setStatus('URL nên bắt đầu bằng http:// hoặc https://');
        return;
    }

    saveQrConfig();
    var preview = document.getElementById('vsPreview');
    preview.innerHTML = '<div class="vs-empty">Đang tạo QR...</div>';
    setStatus('');

    var previousData = currentData;
    var previousImage = currentImage;
    var previousHistoryId = currentHistoryId;
    var previousDesign = currentDesign;
    currentData = data;
    currentHistoryId = '';
    currentDesign = normalizeDesign({foreground:'#111827',background:'#FFFFFF',style:'square',logoDataUrl:''});
    syncDesignFields(currentDesign);
    $('#vsApplyDesign').prop('disabled', false);
    $('#vsDesignWarning').text('✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.');

    renderQrImage(currentData, currentDesign, qrConfig.size || 300, function(imageUrl) {
        currentImage = imageUrl;
        preview.innerHTML = '';
        var image = new Image();
        image.alt = 'QR Code';
        image.src = currentImage;
        preview.appendChild(image);
        $('#vsDownload,#vsCopy,#vsOpen').prop('disabled',false);
        setStatus('✓ QR Code đã được tạo');
        saveHistory(data, record);
        saveCurrentQrState();
        track('qr_generate',{qr_type:currentType});
    }, function() {
        currentData = previousData;
        currentImage = previousImage;
        currentHistoryId = previousHistoryId;
        currentDesign = previousDesign;
        if (previousImage) {
            preview.innerHTML = '';
            var previousQr = new Image();
            previousQr.alt = 'QR Code';
            previousQr.src = previousImage;
            preview.appendChild(previousQr);
            syncDesignFields(currentDesign);
            $('#vsDownload,#vsCopy,#vsOpen').prop('disabled', false);
            $('#vsApplyDesign').prop('disabled', false);
            $('#vsDesignWarning').text('✓ Bạn có thể thay đổi thiết kế và xem kết quả ngay.');
        } else {
            preview.innerHTML = '<div class="vs-empty">Chưa có mã QR</div>';
            $('#vsDownload,#vsCopy,#vsOpen,#vsApplyDesign').prop('disabled', true);
            $('#vsDesignWarning').text('Tạo QR trước, sau đó bạn có thể tùy chỉnh.');
        }
        setStatus('Không thể tạo QR. Nội dung có thể quá dài hoặc không phù hợp với mức sửa lỗi hiện tại.');
    });
}

$(function(){
    loadQrConfig();
    applyQrConfig();
    var initialType = 'url';
    var savedTab = '';
    try {
        var queryType = new URLSearchParams(window.location.search).get('type');
        if (queryType && fields[queryType]) {
            initialType = queryType;
        } else {
            savedTab = localStorage.getItem(activeTabKey) || '';
            if (savedTab && fields[savedTab]) initialType = savedTab;
        }
    } catch (e) {}
    renderFields(initialType);
    renderResultDesignPanel();
    restoreCurrentQrState();
    $('#vsTabs').off('click.qrTabs').on('click.qrTabs', 'a[data-type]', function(e){
        e.preventDefault();
        e.stopPropagation();
        var type = $(this).attr('data-type');
        try { localStorage.setItem(activeTabKey, type); } catch (e) {}
        try {
            var url = new URL(window.location.href);
            url.searchParams.set('type', type);
            window.history.replaceState(null, '', url.toString());
        } catch (e) {}
        if (fields[type]) {
            renderFields(type);
        }
    });
    $('#vsGenerate').on('click',generate);
    $('#vsClear').on('click',function(){renderFields(currentType);$('#vsStatus').text('');});
    $('#vsExportExcel').on('click',exportExcel);
    $('#vsSize,#vsLevel').on('change', function(){
        saveQrConfig();
        if (currentData) {
            renderQrImage(currentData, currentDesign, qrConfig.size || 300, function(imageUrl) {
                currentImage = imageUrl;
                var preview = document.getElementById('vsPreview');
                if (!preview) return;
                preview.innerHTML = '';
                var image = new Image();
                image.alt = 'QR Code';
                image.src = currentImage;
                preview.appendChild(image);
                $('#vsDownload,#vsCopy,#vsOpen').prop('disabled', false);
                saveCurrentQrState();
            });
        }
    });
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
    $(window).off('resize.qrLocation').on('resize.qrLocation', function(){
        if (locationMap) locationMap.invalidateSize(true);
    });
});
})();
