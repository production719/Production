/**
 * Backend สำหรับเว็บบันทึกข้อมูลผลิต (นึ่ง / รีด / ตัด / แพ็ค)
 * วางโค้ดนี้ใน Google Sheets > ส่วนขยาย > Apps Script แล้ว Deploy เป็น Web app
 * ระบบจะสร้างแท็บ "ไลน์นึ่ง" "ไลน์รีด" "ไลน์ตัด" "ไลน์แพ็ค" ให้อัตโนมัติ
 */

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      out = handle_(req);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: 'Production log API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

var ALLOWED_SHEETS = ['ไลน์นึ่ง', 'ไลน์รีด', 'ไลน์ตัด', 'ไลน์แพ็ค'];

function handle_(req) {
  if (ALLOWED_SHEETS.indexOf(req.sheet) < 0) throw new Error('unknown sheet');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();

  if (req.action === 'delete') {
    var shD = ss.getSheetByName(req.sheet);
    if (!shD) return { ok: true };
    var r = findRow_(shD, req.id);
    if (r) shD.deleteRow(r);
    return { ok: true };
  }

  var sh = ensureSheet_(ss, req.sheet, req.headers, req.types);
  var ncol = req.headers.length;

  if (req.action === 'list') {
    var last = sh.getLastRow();
    if (last < 2) return { ok: true, rows: [] };
    var vals = sh.getRange(2, 1, last - 1, ncol).getValues();
    // give an id to rows that were pasted in by hand
    vals.forEach(function (row, i) {
      var hasData = row.slice(1).some(function (v) { return v !== ''; });
      if (row[0] === '' && hasData) {
        row[0] = Utilities.getUuid().slice(0, 12);
        sh.getRange(i + 2, 1).setValue(row[0]);
      }
    });
    var rows = vals.filter(function (row) { return row[0] !== ''; }).map(function (row) {
      return row.map(function (v, i) {
        if (v instanceof Date) {
          if (req.types[i] === 'timestamp') return v.getTime();
          return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        }
        return v;
      });
    });
    return { ok: true, rows: rows };
  }

  var row = toSheetRow_(req.row, req.types);

  if (req.action === 'add') {
    sh.appendRow(row);
    return { ok: true };
  }

  if (req.action === 'update') {
    var rr = findRow_(sh, req.id);
    if (!rr) throw new Error('ไม่พบรายการ (อาจถูกลบไปแล้ว)');
    sh.getRange(rr, 1, 1, row.length).setValues([row]);
    return { ok: true };
  }

  throw new Error('unknown action');
}

function toSheetRow_(row, types) {
  return row.map(function (v, i) {
    if (types[i] === 'timestamp' && v) return new Date(Number(v));
    return v === null ? '' : v;
  });
}

function ensureSheet_(ss, name, headers, types) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#5f7f4f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.hideColumns(1); // id column
    types.forEach(function (t, i) {
      var col = sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1);
      if (t === 'text') col.setNumberFormat('@');
      else if (t === 'timestamp') col.setNumberFormat('dd/MM/yyyy HH:mm:ss');
      else if (t === 'date') col.setNumberFormat('dd/MM/yyyy');
    });
  } else {
    // add any new columns that appear in a later version of the web page
    var cur = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
    if (cur.length < headers.length || cur.join('|') !== headers.slice(0, cur.length).join('|')) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sh;
}

function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}
