(function (global) {
'use strict';

var STORAGE_KEY = 'vietsoft_qr_history_v2';
var MAX_ITEMS = 50;

function read() {
    try {
        var items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(items) ? items : [];
    } catch (e) {
        return [];
    }
}

function write(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch (e) {
        return false;
    }
}

global.VietSoftQrHistoryRepository = {
    getAll: function () {
        return read();
    },

    save: function (item) {
        var items = read();
        items.unshift(item);
        return write(items.slice(0, MAX_ITEMS));
    },

    saveMany: function (newItems) {
        var items = read();
        (newItems || []).slice().reverse().forEach(function (item) {
            items.unshift(item);
        });
        return write(items.slice(0, MAX_ITEMS));
    },

    update: function (historyId, updater) {
        var items = read();
        for (var i = 0; i < items.length; i++) {
            if (String(items[i] && items[i].historyId || '') === String(historyId || '')) {
                var updated = typeof updater === 'function' ? updater(items[i]) : updater;
                if (updated) items[i] = updated;
                return write(items);
            }
        }
        return false;
    },

    remove: function (historyId) {
        var items = read();
        var filtered = items.filter(function (item) {
            return String(item && item.historyId || '') !== String(historyId || '');
        });
        if (filtered.length === items.length) return false;
        return write(filtered);
    },

    clearByType: function (type) {
        var items = read();
        return write(items.filter(function (item) {
            return item && item.type !== type;
        }));
    },

    replace: function (items) {
        return write((items || []).slice(0, MAX_ITEMS));
    }
};
})(window);
