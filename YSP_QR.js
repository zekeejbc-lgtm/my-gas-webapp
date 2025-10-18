(function (factory) {
  var root;
  if (typeof window !== 'undefined') {
    root = window;
  } else if (typeof self !== 'undefined') {
    root = self;
  } else if (typeof globalThis !== 'undefined') {
    root = globalThis;
  } else {
    try {
      root = Function('return this')();
    } catch (err) {
      root = {};
    }
  }
  factory(root || {});
})(function (root) {
  'use strict';

  if (!root) {
    return;
  }

  if (!root.document) {
    root.setupQrAttendance = root.setupQrAttendance || function () {};
    root.startScanner = root.startScanner || function () {};
    root.stopScanner = root.stopScanner || function () {};
    root.onScan = root.onScan || function () {};
    root.onScanError = root.onScanError || function () {};
    return;
  }

  var $ = typeof root.$ === 'function' ? root.$ : function () { return null; };
  var toastFn = typeof root.toast === 'function' ? root.toast : function () {};
  var callServer = root.YSP && root.YSP.utils && typeof root.YSP.utils.callServer === 'function'
    ? root.YSP.utils.callServer
    : function () {};

  var html5Scanner = null;
  var scannerRunning = false;
  var bound = false;

  function setupQrAttendance() {
    if (typeof root.populateActiveEvents === 'function') {
      root.populateActiveEvents('#event-select');
    }
    var output = $('#scan-output');
    if (output) {
      output.innerHTML = '';
    }
    var fileInput = $('#qr-file');
    if (fileInput && fileInput.dataset.bound !== '1') {
      fileInput.dataset.bound = '1';
      fileInput.addEventListener('change', function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) {
          return;
        }
        decodeFile(file);
        event.target.value = '';
      });
    }
    if (!bound) {
      bound = true;
      var startBtn = $('#btn-start-scan');
      var stopBtn = $('#btn-stop-scan');
      if (startBtn) {
        startBtn.addEventListener('click', startScanner);
      }
      if (stopBtn) {
        stopBtn.addEventListener('click', stopScanner);
      }
    }
  }

  function ensureScanner() {
    if (html5Scanner) {
      return html5Scanner;
    }
    if (typeof root.Html5Qrcode === 'undefined') {
      toastFn('Scanner library not available.');
      return null;
    }
    html5Scanner = new root.Html5Qrcode('scanner');
    return html5Scanner;
  }

  function startScanner() {
    var eventSelect = $('#event-select');
    var eventId = eventSelect && eventSelect.value;
    if (!eventId) {
      toastFn('Select an event before scanning.');
      return;
    }
    var scanner = ensureScanner();
    if (!scanner || scannerRunning) {
      return;
    }
    scannerRunning = true;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        function (decodedText) {
          onScan(decodedText);
        },
        onScanError
      )
      .catch(function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to start camera. Try the upload option.');
        scannerRunning = false;
      });
  }

  function stopScanner() {
    if (!html5Scanner || !scannerRunning) {
      return;
    }
    html5Scanner
      .stop()
      .then(function () {
        html5Scanner.clear();
        scannerRunning = false;
      })
      .catch(function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        scannerRunning = false;
      });
  }

  function onScan(decodedText) {
    if (!decodedText) {
      return;
    }
    var eventSelect = $('#event-select');
    var eventId = eventSelect && eventSelect.value;
    if (!eventId) {
      toastFn('Select an event before scanning.');
      return;
    }
    appendScanLog({ text: decodedText, status: 'pending' });
    callServer(
      'logAttendanceScan',
      [decodedText, eventId],
      function (res) {
        appendScanLog({
          text: decodedText,
          status: res && res.success ? 'success' : 'error',
          message: (res && res.message) || '',
        });
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        appendScanLog({ text: decodedText, status: 'error', message: 'Failed to record attendance.' });
      },
      { success: true, message: 'Recorded attendance.' }
    );
  }

  function appendScanLog(entry) {
    var output = $('#scan-output');
    if (!output) {
      return;
    }
    var row = document.createElement('div');
    row.className = 'scan-entry ' + (entry.status || 'info');
    row.innerHTML =
      '<strong>' +
      esc(entry.text || 'Unknown code') +
      '</strong><p class="muted">' +
      esc(entry.message || (entry.status === 'success' ? 'Attendance recorded.' : 'Processing…')) +
      '</p>';
    if (typeof output.prepend === 'function') {
      output.prepend(row);
    } else {
      output.insertBefore(row, output.firstChild);
    }
  }

  function decodeFile(file) {
    if (typeof root.Html5Qrcode === 'undefined') {
      toastFn('Scanner library not available.');
      return;
    }
    root.Html5Qrcode
      .scanFile(file, true)
      .then(function (result) {
        onScan(result);
      })
      .catch(function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to read the QR code from the file.');
      });
  }

  function onScanError(err) {
    if (root.console && typeof root.console.debug === 'function') {
      root.console.debug('Scan error', err);
    }
  }

  root.YSP = root.YSP || {};
  root.YSP.qr = root.YSP.qr || {};
  root.YSP.qr.setupQrAttendance = setupQrAttendance;
  root.YSP.qr.startScanner = startScanner;
  root.YSP.qr.stopScanner = stopScanner;
  root.YSP.qr.onScan = onScan;
  root.YSP.qr.onScanError = onScanError;

  root.setupQrAttendance = setupQrAttendance;
  root.startScanner = startScanner;
  root.stopScanner = stopScanner;
  root.onScan = onScan;
  root.onScanError = onScanError;
});
