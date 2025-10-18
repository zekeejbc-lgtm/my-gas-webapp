(function () {
  'use strict';

  var html5Scanner = null;
  var scannerRunning = false;
  var scanLog = [];
  var bound = false;

  function setupQrAttendance() {
    populateActiveEvents('#event-select');
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
    if (typeof Html5Qrcode === 'undefined') {
      toast('Scanner library not available.');
      return null;
    }
    html5Scanner = new Html5Qrcode('scanner');
    return html5Scanner;
  }

  function startScanner() {
    var eventSelect = $('#event-select');
    var eventId = eventSelect && eventSelect.value;
    if (!eventId) {
      toast('Select an event before scanning.');
      return;
    }
    var scanner = ensureScanner();
    if (!scanner) {
      return;
    }
    if (scannerRunning) {
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
        console.error(err);
        toast('Unable to start camera. Try the upload option.');
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
        console.error(err);
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
      toast('Select an event before scanning.');
      return;
    }
    appendScanLog({ text: decodedText, status: 'pending' });
    YSP.utils.callServer(
      'logAttendanceScan',
      [decodedText, eventId],
      function (res) {
        appendScanLog({ text: decodedText, status: res && res.success ? 'success' : 'error', message: (res && res.message) || '' });
      },
      function (err) {
        console.error(err);
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
    output.prepend(row);
  }

  function decodeFile(file) {
    if (typeof Html5Qrcode === 'undefined') {
      toast('Scanner library not available.');
      return;
    }
    Html5Qrcode.getCameras().then(function () {}).catch(function () {});
    Html5Qrcode
      .scanFile(file, true)
      .then(function (result) {
        onScan(result);
      })
      .catch(function (err) {
        console.error(err);
        toast('Unable to read the QR code from the file.');
      });
  }

  function onScanError(err) {
    // no-op to reduce noise
    if (window.console && console.debug) {
      console.debug('Scan error', err);
    }
  }

  window.setupQrAttendance = setupQrAttendance;
  window.startScanner = startScanner;
  window.stopScanner = stopScanner;
  window.onScan = onScan;
  window.onScanError = onScanError;
})();
