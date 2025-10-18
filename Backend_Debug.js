// DirectoryLookup.gs
// Youth Service Philippines - Tagum Chapter (Backend complete)
// Spreadsheet ID (final provided)
const SPREADSHEET_ID = "1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU";

// Name of the frontend HTML file (change here if your HTML file uses a different name)
const FRONTEND_HTML = "SearchPage"; // <-- ensure this matches your HTML filename in Apps Script

// Column indexes (1-based) for "User Profiles" - helpful constants
const COL = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12, M: 13,
  N: 14, O: 15, P: 16, Q: 17, R: 18, S: 19, T: 20, U: 21, V: 22
};

// ---------- Utilities ----------
function _open(id = SPREADSHEET_ID) {
  return SpreadsheetApp.openById(id);
}

function _sheet(name) {
  const ss = _open();
  const sh = ss.getSheetByName(name);
  if (!sh) {
    throw new Error(`Sheet '${name}' not found.`);
  }
  return sh;
}

function _nowString() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function _timeString() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function health() {
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

function whoAmI() {
  return {
    email: Session.getActiveUser().getEmail() || '',
    time: new Date()
  };
}

function logClientError(msg, src, line, col) {
  console.error('CLIENT_ERROR', {
    message: String(msg),
    source: String(src),
    line: Number(line) || 0,
    column: Number(col) || 0
  });
  return { success: true };
}

// ---------- doGet (serves the main html) ----------
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.health === '1') {
      return health();
    }
    Logger.log('doGet: serving HTML: %s', FRONTEND_HTML);
    var template = HtmlService.createTemplateFromFile(FRONTEND_HTML);
    return template
      .evaluate()
      .setTitle('YSP Tagum — Member App')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    Logger.log('doGet Error: ' + err);
    return HtmlService.createHtmlOutput('<pre>Error serving page: ' + err.toString() + '</pre>');
  }
}

function include(filename) {
  var name = String(filename == null ? '' : filename).trim();
  if (!name) {
    throw new Error('include: filename is required');
  }
  name = name.replace(/\.(?:html|gs|css|js)$/gi, '');
  try {
    return HtmlService.createHtmlOutputFromFile(name).getContent();
  } catch (err) {
    console.error('include error for', name, err);
    throw err;
  }
}

function getQrScannerUrl() {
  try {
    const baseUrl = ScriptApp.getService().getUrl();
    if (!baseUrl) {
      return null;
    }
    return baseUrl + '#qr-attendance-panel';
  } catch (err) {
    Logger.log('getQrScannerUrl error: ' + err);
    return null;
  }
}

// ---------- Login (User Profiles sheet) ----------
/*
  Expects credentials: { username: string, password: string }
  Returns: { success: bool, user: { name, idCode, position, role, username }, message }
*/
function checkLogin(credentials) {
  try {
    if (!credentials || !credentials.username || !credentials.password) {
      return { success: false, message: "Missing username or password." };
    }
    const userProps = PropertiesService.getUserProperties();
    userProps.deleteProperty('YSP_CURRENT_USER');
    const sh = _sheet("User Profiles");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: "No user profiles found." };

    // iterate rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const username = (row[COL.N - 1] || "").toString().trim();
      const password = (row[COL.O - 1] || "").toString().trim();
      if (username === credentials.username && password === credentials.password) {
        const user = {
          name: (row[COL.D - 1] || "").toString().trim(),
          idCode: (row[COL.S - 1] || "").toString().trim(),
          position: (row[COL.T - 1] || "").toString().trim(),
          role: (row[COL.U - 1] || "").toString().trim(),
          username: username,
          email: (row[COL.B - 1] || "").toString().trim()
        };
        user.id = user.idCode || user.username || "";
        // log access
        logAccess({ idCode: user.idCode, name: user.name });
        userProps.setProperty('YSP_CURRENT_USER', JSON.stringify({ user }));
        Logger.log("checkLogin success for %s (%s)", user.name, user.idCode);
        return { success: true, user: user };
      }
    }
    return { success: false, message: "Invalid username or password." };
  } catch (err) {
    Logger.log("checkLogin error: " + err);
    return { success: false, message: "Server error during login." };
  }
}

function validateLogin(username, password) {
  try {
    var creds = {};
    if (typeof username === 'object' && username) {
      creds.username = String(username.username || username.email || '').trim();
      creds.password = String(username.password || username.pass || '').trim();
    } else {
      creds.username = String(username || '').trim();
      creds.password = String(password || '').trim();
    }
    return checkLogin({ username: creds.username, password: creds.password });
  } catch (err) {
    Logger.log('validateLogin error: ' + err);
    return { success: false, message: 'Unable to validate credentials.' };
  }
}

function guestLogin(name) {
  try {
    var safeName = String(name || '').trim();
    if (!safeName) {
      safeName = 'Guest';
    }
    var guestId = 'GUEST-' + Utilities.getUuid().slice(-6).toUpperCase();
    var user = {
      name: safeName,
      role: 'Guest',
      position: 'Guest',
      idCode: guestId,
      id: guestId,
      email: '',
      isGuest: true
    };
    PropertiesService.getUserProperties().setProperty('YSP_CURRENT_USER', JSON.stringify({ user: user }));
    logAccess({ idCode: user.idCode, name: user.name });
    return { success: true, user: user };
  } catch (err) {
    Logger.log('guestLogin error: ' + err);
    return { success: false, message: 'Unable to complete guest login.' };
  }
}

function getSession() {
  try {
    const userProps = PropertiesService.getUserProperties();
    const raw = userProps.getProperty('YSP_CURRENT_USER');
    if (!raw) {
      return { success: false, user: null };
    }
    const parsed = JSON.parse(raw);
    return { success: true, user: parsed.user || null };
  } catch (err) {
    Logger.log('getSession error: ' + err);
    return { success: false, user: null };
  }
}

function logout() {
  try {
    PropertiesService.getUserProperties().deleteProperty('YSP_CURRENT_USER');
    return { success: true };
  } catch (err) {
    Logger.log('logout error: ' + err);
    return { success: false, message: 'Unable to logout.' };
  }
}

// ---------- User profile fetch ----------
/*
  getUserProfile(idCode) -> { success: true, data: { ... } } or { success:false, message }
  Returns object keyed by friendly names (Email Address, Full name, etc.)
*/
function getUserProfile(idCode) {
  try {
    if (!idCode) return { success: false, message: "Missing idCode." };
    const sh = _sheet("User Profiles");
    const data = sh.getDataRange().getValues();
    const headers = data[0] || [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const candidateId = (row[COL.S - 1] || "").toString().trim();
      if (candidateId === idCode) {
        const obj = {};
        // map values to helpful keys (use header names if present)
        headers.forEach((h, idx) => {
          const key = (h || "").toString().trim() || `col${idx+1}`;
          obj[key] = row[idx];
        });
        // also create friendly aliases
        obj["Email Address (B)"] = row[COL.B - 1];
        obj["Full name (D)"] = row[COL.D - 1];
        obj["Date of Birth (E)"] = row[COL.E - 1];
        obj["Age (F)"] = row[COL.F - 1];
        obj["Sex/Gender (G)"] = row[COL.G - 1];
        obj["Pronouns (H)"] = row[COL.H - 1];
        obj["Civil Status (I)"] = row[COL.I - 1];
        obj["Contact Number (J)"] = row[COL.J - 1];
        obj["Religion (K)"] = row[COL.K - 1];
        obj["Nationality (L)"] = row[COL.L - 1];
        obj["Username (N)"] = row[COL.N - 1];
        obj["Password (O)"] = row[COL.O - 1];
        obj["ID Code (S)"] = row[COL.S - 1];
        obj["Position (T)"] = row[COL.T - 1];
        obj["Role (U)"] = row[COL.U - 1];
        obj["ProfilePictureURL (V)"] = row[COL.V - 1];
        Logger.log("getUserProfile: found profile for %s", idCode);
        return { success: true, data: obj };
      }
    }
    return { success: false, message: "User profile not found." };
  } catch (err) {
    Logger.log("getUserProfile error: " + err);
    return { success: false, message: "Server error retrieving profile." };
  }
}

// ---------- Homepage Content ----------
/*
  getHomepageContent() -> returns parsed key/value pairs from "Homepage Content"
  Expects sheet with keys in column A and values in column B.
  Recognizes keys: mission, vision, objectives, orgChartUrl, facebookUrl, email, founderName, aboutYSP, projectImageUrl_#, projectDesc_#
*/
function getHomepageContent() {
  try {
    const sh = _sheet("Homepage Content");
    const data = sh.getDataRange().getValues();
    const content = { projects: [] };
    const projects = {}; // keyed by index
    for (let i = 0; i < data.length; i++) {
      const key = (data[i][0] || "").toString().trim();
      const value = data[i][1] || "";
      if (!key) continue;
      if (key.startsWith("projectImageUrl_")) {
        const idx = key.split("_")[1];
        if (!projects[idx]) projects[idx] = {};
        projects[idx].imageUrl = value;
      } else if (key.startsWith("projectDesc_")) {
        const idx = key.split("_")[1];
        if (!projects[idx]) projects[idx] = {};
        projects[idx].description = value;
      } else {
        content[key] = value;
      }
    }
    // order projects by index numeric
    const keys = Object.keys(projects).sort((a,b) => parseInt(a) - parseInt(b));
    content.projects = keys.map(k => projects[k]);
    Logger.log("getHomepageContent loaded %d projects", content.projects.length);
    return { success: true, data: content };
  } catch (err) {
    Logger.log("getHomepageContent error: " + err);
    return { success: false, message: err.message };
  }
}

// ---------- Officer Directory ----------
function getOfficerData() {
  try {
    const sh = _sheet("Officer Directory");
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const range = sh.getRange(2, 1, lastRow - 1, 3); // A2:C
    const data = range.getValues().filter(r => r[0] || r[1] || r[2]);
    Logger.log("getOfficerData: %d rows", data.length);
    return { success: true, data: data };
  } catch (err) {
    Logger.log("getOfficerData error: " + err);
    return { success: false, message: "Could not retrieve officer directory." };
  }
}

function officerSuggestions(query) {
  try {
    const res = getOfficerData();
    if (!res.success) {
      return res;
    }
    const q = String(query || '').trim().toLowerCase();
    const suggestions = res.data.map(function(row) {
      return {
        id: (row[0] || '').toString().trim(),
        name: (row[1] || '').toString().trim(),
        role: (row[2] || '').toString().trim(),
        email: ''
      };
    }).filter(function(item) {
      if (!q) return true;
      return item.id.toLowerCase().indexOf(q) !== -1 || item.name.toLowerCase().indexOf(q) !== -1 || item.role.toLowerCase().indexOf(q) !== -1;
    });
    return { success: true, suggestions: suggestions };
  } catch (err) {
    Logger.log('officerSuggestions error: ' + err);
    return { success: false, message: 'Unable to load suggestions.' };
  }
}

function getRecordById(idCode) {
  try {
    if (!idCode) {
      return { success: false, message: 'Missing idCode.' };
    }
    const profile = getUserProfile(idCode);
    if (profile && profile.success && profile.data) {
      const data = profile.data;
      const record = {
        id: data['ID Code (S)'] || idCode,
        name: data['Full name (D)'] || data['Name'] || '',
        role: data['Position (T)'] || data['Role (U)'] || '',
        email: data['Email Address (B)'] || data['Email'] || '',
        avatar: data['ProfilePictureURL (V)'] || ''
      };
      return { success: true, record: record };
    }
    const officers = officerSuggestions(idCode);
    if (officers && officers.success && officers.suggestions && officers.suggestions.length) {
      const record = officers.suggestions[0];
      return { success: true, record: record };
    }
    return { success: false, message: 'Record not found.' };
  } catch (err) {
    Logger.log('getRecordById error: ' + err);
    return { success: false, message: 'Unable to retrieve record.' };
  }
}

// ---------- Access Logging ----------
function logAccess(userInfo) {
  try {
    const sh = _sheet("Access Logs");
    sh.appendRow([new Date(), (userInfo && userInfo.idCode) || "", (userInfo && userInfo.name) || ""]);
  } catch (e) {
    Logger.log("logAccess Error: " + e);
  }
}

function getAccessLogs() {
  try {
    const sh = _sheet("Access Logs");
    const data = sh.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    const rows = data.slice(1).reverse().map(r => ({
      timestamp: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
      idCode: r[1] || "",
      name: r[2] || ""
    }));
    return { success: true, data: rows };
  } catch (err) {
    Logger.log("getAccessLogs error: " + err);
    return { success: false, message: err.message };
  }
}

// ---------- Feedback ----------
function submitFeedback(feedbackData) {
  try {
    const sh = _sheet("Feedback");
    sh.appendRow([new Date(), feedbackData.name || "", feedbackData.idCode || "", feedbackData.message || ""]);
    Logger.log("submitFeedback: %s (%s)", feedbackData.name, feedbackData.idCode);
    return { success: true, message: "Feedback submitted." };
  } catch (e) {
    Logger.log("submitFeedback Error: " + e);
    return { success: false, message: "Could not submit feedback." };
  }
}

function getFeedback() {
  try {
    const sh = _sheet("Feedback");
    const data = sh.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    const rows = data.slice(1).reverse().map(r => ({
      timestamp: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
      name: r[1] || "",
      idCode: r[2] || "",
      message: r[3] || ""
    }));
    return { success: true, data: rows };
  } catch (err) {
    Logger.log("getFeedback error: " + err);
    return { success: false, message: err.message };
  }
}

function listAllFeedback() {
  try {
    const res = getFeedback();
    if (!res.success) {
      return res;
    }
    const feedback = (res.data || []).map(function(item) {
      return {
        timestamp: item.timestamp,
        createdAt: item.timestamp,
        name: item.name,
        idCode: item.idCode,
        message: item.message
      };
    });
    return { success: true, data: { feedback: feedback } };
  } catch (err) {
    Logger.log('listAllFeedback error: ' + err);
    return { success: false, message: 'Unable to load feedback.' };
  }
}

function listMyFeedback() {
  try {
    const session = getSession();
    const user = session && session.user ? session.user : null;
    const idCode = user && (user.idCode || user.id) ? (user.idCode || user.id) : '';
    const res = getFeedback();
    if (!res.success) {
      return res;
    }
    const feedback = (res.data || []).filter(function(item) {
      if (!idCode) { return true; }
      return (item.idCode || '').toString().trim() === idCode;
    }).map(function(item) {
      return {
        timestamp: item.timestamp,
        createdAt: item.timestamp,
        name: item.name,
        idCode: item.idCode,
        message: item.message
      };
    });
    return { success: true, data: { feedback: feedback } };
  } catch (err) {
    Logger.log('listMyFeedback error: ' + err);
    return { success: false, message: 'Unable to load feedback.' };
  }
}

function sendFeedback(text) {
  try {
    const message = String(text || '').trim();
    if (!message) {
      return { success: false, message: 'Feedback cannot be empty.' };
    }
    const session = getSession();
    const user = session && session.user ? session.user : {};
    const payload = {
      name: user.name || 'Anonymous',
      idCode: user.idCode || user.id || '',
      message: message
    };
    return submitFeedback(payload);
  } catch (err) {
    Logger.log('sendFeedback error: ' + err);
    return { success: false, message: 'Unable to submit feedback.' };
  }
}

// ---------- Events helper (Master Attendance Log) ----------
/*
  Event column layout (3 columns per event) starting at column E (5):
  [E]   = EventDate header (e.g. "Event Name")
  [F]   = Event Time In header (e.g. "Event Name - In")
  [G]   = Event Time Out header (e.g. "Event Name - Out")
  This function returns an array of { name, dateCol, inCol, outCol, index } ordered left -> right
*/
function _getAttendanceEventGroups() {
  const sh = _sheet("Master Attendance Log");
  const lastCol = sh.getLastColumn();
  if (lastCol < 5) return []; // no events
  const headers = sh.getRange(1, 5, 1, lastCol - 4).getValues()[0] || [];
  const groups = [];
  // iterate in groups of 3
  for (let offset = 0; offset < headers.length; offset += 3) {
    const dateCol = 5 + offset;
    const inCol = dateCol + 1;
    const outCol = dateCol + 2;
    const rawName = (headers[offset] || "").toString().trim();
    // fallback: if rawName empty, try next cell
    const name = rawName || (headers[offset + 1] || "").toString().trim() || (headers[offset + 2] || "").toString().trim() || `Event ${groups.length + 1}`;
    groups.push({
      name: name,
      dateCol: dateCol,
      inCol: inCol,
      outCol: outCol,
      index: groups.length
    });
  }
  Logger.log("_getAttendanceEventGroups found %d events", groups.length);
  return groups;
}

// Returns array of event names (for populating dropdowns)
function getEvents() {
  try {
    const groups = _getAttendanceEventGroups();
    const arr = groups.map(g => g.name);
    return { success: true, data: arr };
  } catch (e) {
    Logger.log("getEvents Error: " + e);
    return { success: false, message: "Could not retrieve events." };
  }
}

// ---------- Create new event (adds 3 columns at end) ----------
function createNewEvent(eventName) {
  try {
    if (!eventName || eventName.trim() === "") return "Error: Event name cannot be empty.";
    const sh = _sheet("Master Attendance Log");
    const lastCol = sh.getLastColumn();
    const insertAt = lastCol + 1;
    // Append 3 columns: Date, Time In, Time Out
    sh.insertColumnsAfter(lastCol, 3);
    sh.getRange(1, insertAt, 1, 3).setValues([[ eventName.trim(), `${eventName.trim()} - In`, `${eventName.trim()} - Out` ]]);
    Logger.log("createNewEvent: created event '%s' at cols %d-%d", eventName, insertAt, insertAt+2);
    return `Success: Event '${eventName.trim()}' created.`;
  } catch (e) {
    Logger.log("createNewEvent Error: " + e);
    return "Error: Failed to create event.";
  }
}

function _getDisabledEventIds() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('YSP_DISABLED_EVENTS') || '[]';
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr;
    }
    return [];
  } catch (err) {
    Logger.log('_getDisabledEventIds error: ' + err);
    return [];
  }
}

function _saveDisabledEventIds(arr) {
  try {
    PropertiesService.getScriptProperties().setProperty('YSP_DISABLED_EVENTS', JSON.stringify(arr || []));
  } catch (err) {
    Logger.log('_saveDisabledEventIds error: ' + err);
  }
}

function listEvents() {
  try {
    const groups = _getAttendanceEventGroups();
    const disabled = _getDisabledEventIds();
    const disabledSet = disabled.reduce(function(map, id) { map[id] = true; return map; }, {});
    const events = groups.map(function(group) {
      const sampleDate = group.dateCol ? _sampleEventDate(group.dateCol) : '';
      return {
        id: group.name,
        name: group.name,
        date: sampleDate,
        active: !disabledSet[group.name]
      };
    });
    return { success: true, data: { events: events } };
  } catch (err) {
    Logger.log('listEvents error: ' + err);
    return { success: false, message: 'Failed to load events.' };
  }
}

function _sampleEventDate(dateCol) {
  try {
    const sh = _sheet('Master Attendance Log');
    const range = sh.getRange(2, dateCol, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
    for (let i = 0; i < range.length; i++) {
      const value = range[i][0];
      if (value) {
        return _formatDateForClient(value);
      }
    }
    return '';
  } catch (err) {
    Logger.log('_sampleEventDate error: ' + err);
    return '';
  }
}

function createEvent(payload) {
  try {
    if (!payload || !payload.name) {
      return { success: false, message: 'Event name is required.' };
    }
    const message = createNewEvent(payload.name);
    const disabled = _getDisabledEventIds().filter(function(id) { return id !== payload.name; });
    _saveDisabledEventIds(disabled);
    return { success: true, message: message || 'Event created.' };
  } catch (err) {
    Logger.log('createEvent error: ' + err);
    return { success: false, message: 'Unable to create event.' };
  }
}

function toggleEventActive(eventId) {
  try {
    if (!eventId) {
      return { success: false, message: 'Missing event id.' };
    }
    const disabled = _getDisabledEventIds();
    const index = disabled.indexOf(eventId);
    let message;
    if (index === -1) {
      disabled.push(eventId);
      message = 'Event deactivated.';
    } else {
      disabled.splice(index, 1);
      message = 'Event activated.';
    }
    _saveDisabledEventIds(disabled);
    return { success: true, message: message };
  } catch (err) {
    Logger.log('toggleEventActive error: ' + err);
    return { success: false, message: 'Unable to update event.' };
  }
}

function getActiveEvents() {
  try {
    const groups = _getAttendanceEventGroups();
    const disabled = _getDisabledEventIds();
    const disabledSet = disabled.reduce(function(map, id) { map[id] = true; return map; }, {});
    const events = groups.filter(function(group) {
      return !disabledSet[group.name];
    }).map(function(group) {
      return { id: group.name, name: group.name };
    });
    return { success: true, data: { events: events } };
  } catch (err) {
    Logger.log('getActiveEvents error: ' + err);
    return { success: false, message: 'Unable to load active events.' };
  }
}

// ---------- Attendance recording (scanner & manual) ----------
/*
  recordAttendanceScan(payload)
    payload can be:
      - string idCode (then we mark "Present" for last event's Time In by default)
      - object { idCode, eventName (optional), mode: 'in'|'out' (optional, default 'in'), status (optional e.g. Present/Late) }
    Returns { success: true/false, message: string }
*/
function recordAttendanceScan(payload) {
  try {
    // normalize payload
    let idCode, eventName, mode, status;
    if (typeof payload === 'string') {
      idCode = payload;
      mode = 'in';
      status = 'Present';
    } else if (payload && typeof payload === 'object') {
      idCode = payload.idCode || payload;
      eventName = payload.eventName;
      mode = (payload.mode || 'in').toLowerCase();
      status = payload.status || (mode === 'in' ? 'Present' : 'Present');
    } else {
      return { success: false, message: "Invalid payload." };
    }
    if (!idCode) return { success: false, message: "Missing ID code." };
    const sh = _sheet("Master Attendance Log");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: "Attendance sheet has no rows." };

    // find officer row by ID (column A)
    let officerRow = -1;
    let officerName = "";
    for (let r = 1; r < data.length; r++) {
      const rowId = (data[r][0] || "").toString().trim();
      if (rowId === idCode) {
        officerRow = r + 1; // 1-based row
        officerName = (data[r][1] || "").toString().trim();
        break;
      }
    }
    if (officerRow === -1) return { success: false, message: `ID Code '${idCode}' not found.` };

    // choose event group
    const groups = _getAttendanceEventGroups();
    if (groups.length === 0) return { success: false, message: "No events available." };

    let group = null;
    if (eventName) {
      group = groups.find(g => g.name.toLowerCase() === eventName.toLowerCase());
    }
    if (!group) {
      // fallback: use last (most recent) event group
      group = groups[groups.length - 1];
    }
    const colToWrite = (mode === 'out') ? group.outCol : group.inCol;
    const dateCol = group.dateCol;
    const now = new Date();
    const timeFormatted = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    // write date if missing (in date column)
    const existingDate = sh.getRange(officerRow, dateCol).getValue();
    if (!existingDate) {
      sh.getRange(officerRow, dateCol).setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"));
    }
    // write status/time into chosen column; format "Present - 2025-10-16 13:45:00" or "Late - ..."
    const entry = `${status} - ${timeFormatted}`;
    sh.getRange(officerRow, colToWrite).setValue(entry);

    Logger.log("recordAttendanceScan: %s -> event '%s' (%s column) on row %d", idCode, group.name, (mode==='out'?'OUT':'IN'), officerRow);
    return { success: true, message: `${officerName || idCode} marked as ${status}.` };
  } catch (err) {
    Logger.log("recordAttendanceScan error: " + err);
    return { success: false, message: "Unexpected server error." };
  }
}

/*
  recordManualAttendance(idCode, status, eventName?, mode?)
    Admins use this to mark Present/Late/Absent/Excused.
    Writes to the appropriate In/Out cell in Master Attendance Log with "STATUS - timestamp"
*/
function recordManualAttendance(idCode, status, eventName, mode) {
  try {
    if (!idCode) return { success: false, message: "Missing ID code." };
    if (!status) return { success: false, message: "Missing status." };
    const sh = _sheet("Master Attendance Log");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: "Attendance sheet has no rows." };

    // find officer row by ID (column A)
    let officerRow = -1;
    let officerName = "";
    for (let r = 1; r < data.length; r++) {
      const rowId = (data[r][0] || "").toString().trim();
      if (rowId === idCode) {
        officerRow = r + 1; // 1-based row
        officerName = (data[r][1] || "").toString().trim();
        break;
      }
    }
    if (officerRow === -1) return { success: false, message: `ID Code '${idCode}' not found.` };

    // choose event
    const groups = _getAttendanceEventGroups();
    if (groups.length === 0) return { success: false, message: "No events available." };

    let group = null;
    if (eventName) {
      group = groups.find(g => g.name.toLowerCase() === eventName.toLowerCase());
    }
    if (!group) {
      group = groups[groups.length - 1];
    }
    const useMode = (mode || "in").toLowerCase();
    const colToWrite = (useMode === 'out') ? group.outCol : group.inCol;
    const now = new Date();
    const timeFormatted = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    const entry = `${status} - ${timeFormatted}`;

    // set date if empty
    const dateCol = group.dateCol;
    const existingDate = sh.getRange(officerRow, dateCol).getValue();
    if (!existingDate) {
      sh.getRange(officerRow, dateCol).setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"));
    }

    sh.getRange(officerRow, colToWrite).setValue(entry);
    Logger.log("recordManualAttendance: %s marked %s (%s) for event '%s'", idCode, status, useMode, group.name);
    return { success: true, message: `${officerName || idCode} recorded as ${status}.` };
  } catch (err) {
    Logger.log("recordManualAttendance error: " + err);
    return { success: false, message: "Failed to record manual attendance." };
  }
}

function logAttendanceScan(decodedText, eventId) {
  try {
    if (!decodedText) {
      return { success: false, message: 'Missing QR code value.' };
    }
    const payload = {
      idCode: decodedText,
      eventName: eventId,
      mode: 'in',
      status: 'Present'
    };
    return recordAttendanceScan(payload);
  } catch (err) {
    Logger.log('logAttendanceScan error: ' + err);
    return { success: false, message: 'Unable to record scan.' };
  }
}

function manualAttendance(idCode, eventId, action) {
  try {
    const mode = (action || 'in').toLowerCase() === 'out' ? 'out' : 'in';
    const status = mode === 'out' ? 'Signed Out' : 'Present';
    return recordManualAttendance(idCode, status, eventId, mode);
  } catch (err) {
    Logger.log('manualAttendance error: ' + err);
    return { success: false, message: 'Failed to record manual attendance.' };
  }
}

// ---------- Attendance Transparency (per user) ----------
/*
  getAttendanceTransparencyForUser(idCode)
    Returns array of { date, event, timeIn, timeOut, status }
    "status" determined by prefix of the timeIn/timeOut cell (Present/Late/Absent/Excused)
*/
function getAttendanceTransparencyForUser(idCode) {
  try {
    if (!idCode) return { success: false, message: "Missing idCode." };
    const sh = _sheet("Master Attendance Log");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: true, data: [] };

    // find row by ID (column A)
    let userRowIndex = -1;
    for (let r = 1; r < data.length; r++) {
      const rid = (data[r][0] || "").toString().trim();
      if (rid === idCode) { userRowIndex = r; break; }
    }
    if (userRowIndex === -1) return { success: true, data: [] };

    const groups = _getAttendanceEventGroups();
    const results = [];
    groups.forEach(g => {
      const dateVal = data[userRowIndex][g.dateCol - 1] || "";
      const inVal = data[userRowIndex][g.inCol - 1] || "";
      const outVal = data[userRowIndex][g.outCol - 1] || "";
      // infer status from inVal text prefix
      let status = "";
      if (inVal && inVal.toString().trim() !== "") {
        const txt = inVal.toString();
        if (txt.startsWith("Present")) status = "Present";
        else if (txt.startsWith("Late")) status = "Late";
        else status = txt.split(" - ")[0] || "Present";
      } else {
        status = (outVal && outVal.toString().trim() !== "") ? "OutRecorded" : "Absent";
      }
      results.push({
        date: dateVal ? _formatDateForClient(dateVal) : "",
        event: g.name,
        timeIn: inVal || "",
        timeOut: outVal || "",
        status: status
      });
    });
    return { success: true, data: results };
  } catch (err) {
    Logger.log("getAttendanceTransparencyForUser error: " + err);
    return { success: false, message: "Failed to load attendance transparency." };
  }
}

function _formatDateForClient(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (isNaN(d)) return v.toString();
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch (e) {
    return v.toString();
  }
}

function getMyAttendance() {
  try {
    const session = getSession();
    const user = session && session.user ? session.user : null;
    if (!user || !(user.idCode || user.id)) {
      return { success: true, data: [] };
    }
    return getAttendanceTransparencyForUser(user.idCode || user.id);
  } catch (err) {
    Logger.log('getMyAttendance error: ' + err);
    return { success: false, message: 'Failed to load attendance.' };
  }
}

function getAttendanceKPIs() {
  try {
    const sh = _sheet('Master Attendance Log');
    const data = sh.getDataRange().getValues();
    if (data.length < 2) {
      return { success: true, data: { stats: { totalEvents: 0, present: 0, absent: 0, late: 0 }, kpi: { labels: [], present: [], absent: [] } } };
    }
    const groups = _getAttendanceEventGroups();
    const stats = { totalEvents: groups.length, present: 0, absent: 0, late: 0 };
    const labels = [];
    const presentCounts = [];
    const absentCounts = [];
    for (let gIndex = 0; gIndex < groups.length; gIndex++) {
      const group = groups[gIndex];
      let present = 0;
      let absent = 0;
      for (let r = 1; r < data.length; r++) {
        const inVal = (data[r][group.inCol - 1] || '').toString().trim();
        if (inVal) {
          present++;
          if (inVal.toLowerCase().indexOf('late') === 0) {
            stats.late++;
          } else {
            stats.present++;
          }
        } else {
          absent++;
          stats.absent++;
        }
      }
      labels.push(group.name);
      presentCounts.push(present);
      absentCounts.push(absent);
    }
    const payload = {
      stats: stats,
      kpi: {
        labels: labels,
        present: presentCounts,
        absent: absentCounts
      }
    };
    return { success: true, data: payload };
  } catch (err) {
    Logger.log('getAttendanceKPIs error: ' + err);
    return { success: false, message: 'Failed to load KPIs.' };
  }
}

// ---------- Announcements ----------
/*
Announcements sheet structure (recommended):
Columns:
1: id (uuid)
2: timestamp
3: title
4: subject
5: body
6: recipients (comma separated)
7: authorId
8: authorName
9: unreadMap (JSON string of { idCode: true/false })
*/

function getAnnouncements() {
  try {
    const sh = _sheet("Announcements");
    const data = sh.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    const rows = data.slice(1).reverse().map(r => {
      const id = r[0];
      const timestamp = r[1] ? Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") : "";
      const title = r[2] || "";
      const subject = r[3] || "";
      const body = r[4] || "";
      const recipientsRaw = r[5] || "";
      let recipients = [];
      try { recipients = recipientsRaw.toString().split(",").map(s=>s.trim()).filter(Boolean); } catch(e){ recipients = []; }
      const authorId = r[6] || "";
      const authorName = r[7] || "";
      let unread = {};
      try {
        unread = r[8] ? JSON.parse(r[8]) : {};
      } catch(e) {
        unread = {};
      }
      return { id, timestamp, title, subject, body, recipients, authorId, authorName, unread };
    });
    return { success: true, data: rows };
  } catch (err) {
    Logger.log("getAnnouncements error: " + err);
    return { success: false, message: "Could not load announcements." };
  }
}

/*
createAnnouncement(payload)
  payload: { authorId, authorName, title, body, recipients: [ 'all'|'heads'|committeeCode|idCode, ... ] }
  - stores announcement
  - creates an unreadMap for all recipients
  - automatically sends emails to recipients with email addresses (if email exists in User Profiles)
*/
function createAnnouncement(payload) {
  try {
    if (!payload || !payload.title || !payload.body) return { success:false, message: "Title and body required." };
    const id = Utilities.getUuid();
    const ts = new Date();
    const title = payload.title;
    const subject = payload.subject || "";
    const body = payload.body;
    const recipients = Array.isArray(payload.recipients) && payload.recipients.length ? payload.recipients : ['all'];
    const authorId = payload.authorId || "";
    const authorName = payload.authorName || "";

    // resolve recipients to list of user objects (with email & idCode)
    const recipientsResolved = _resolveRecipients(recipients);
    // build unread map keyed by idCode
    const unreadMap = {};
    recipientsResolved.forEach(u => { if (u && u.idCode) unreadMap[u.idCode] = true; });

    // append to Announcements sheet
    const sh = _sheet("Announcements");
    sh.appendRow([id, ts, title, subject, body, recipients.join(","), authorId, authorName, JSON.stringify(unreadMap)]);
    Logger.log("createAnnouncement: appended id=%s recipients=%d", id, recipientsResolved.length);

    // send emails automatically to recipients with email address
    const emails = recipientsResolved.map(u => u.email).filter(Boolean);
    if (emails.length > 0) {
      // craft message
      const appName = "Youth Service Philippines - Tagum Chapter";
      const message = `${body}\n\n---\nThis announcement was sent via ${appName}.\n\nAuthor:\n${authorName} ${authorId ? "(" + authorId + ")" : ""}\n\n`;
      const mailSubject = `[${appName}] ${title}${subject ? " - " + subject : ""}`;
      // send as individual emails (so reply-to works per recipient)
      emails.forEach(email => {
        try {
          MailApp.sendEmail({
            to: email,
            subject: mailSubject,
            body: message
          });
        } catch (mailErr) {
          Logger.log("createAnnouncement: failed to send email to %s: %s", email, mailErr);
        }
      });
    } else {
      Logger.log("createAnnouncement: no recipient emails to send.");
    }

    return { success: true, message: "Announcement created." };
  } catch (err) {
    Logger.log("createAnnouncement error: " + err);
    return { success: false, message: "Failed to create announcement." };
  }
}

function listAnnouncements(filter) {
  try {
    const res = getAnnouncements();
    if (!res.success) {
      return res;
    }
    const session = getSession();
    const user = session && session.user ? session.user : null;
    const currentId = (filter && filter.currentUserId) || (user && (user.idCode || user.id)) || '';
    const announcements = (res.data || []).map(function(item) {
      const unreadMap = item.unread || {};
      return {
        id: item.id,
        title: item.title,
        body: item.body,
        createdAt: item.timestamp,
        isUnread: currentId ? !!unreadMap[currentId] : false
      };
    });
    return { success: true, data: { announcements: announcements } };
  } catch (err) {
    Logger.log('listAnnouncements error: ' + err);
    return { success: false, message: 'Unable to load announcements.' };
  }
}

// helper: resolve recipients descriptors to list of users { idCode, email, name }
function _resolveRecipients(recipientTokens) {
  try {
    const sh = _sheet("User Profiles");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    const headers = data[0];
    const users = [];
    // build user objects
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const idCode = (row[COL.S - 1] || "").toString().trim();
      const name = (row[COL.D - 1] || "").toString().trim();
      const email = (row[COL.B - 1] || "").toString().trim();
      const role = (row[COL.U - 1] || "").toString().trim();
      const username = (row[COL.N - 1] || "").toString().trim();
      users.push({ idCode, name, email, role, username });
    }

    const resolved = [];
    const tokens = Array.isArray(recipientTokens) ? recipientTokens : [recipientTokens];
    tokens.forEach(tokRaw => {
      const tok = (tokRaw || "").toString().trim();
      if (!tok) return;
      if (tok.toLowerCase() === 'all') {
        users.forEach(u => resolved.push(u));
        return;
      }
      if (tok.toLowerCase() === 'heads') {
        users.filter(u => (u.role || "").toLowerCase() === 'head').forEach(u=>resolved.push(u));
        return;
      }
      // token could be a committee prefix like 'YSPTIR' -> match idCode startsWith
      const tokenUpper = tok.toUpperCase();
      const matchedByPrefix = users.filter(u => (u.idCode || "").toUpperCase().startsWith(tokenUpper));
      if (matchedByPrefix.length) {
        matchedByPrefix.forEach(u=>resolved.push(u));
        return;
      }
      // token could be a specific ID code
      const matchedId = users.find(u => (u.idCode||"") === tok);
      if (matchedId) {
        resolved.push(matchedId);
        return;
      }
      // else try match by username or full name (fallback)
      const matchedName = users.find(u => ((u.name||"").toLowerCase() === tok.toLowerCase()) || ((u.username||"").toLowerCase() === tok.toLowerCase()));
      if (matchedName) resolved.push(matchedName);
    });

    // unique by idCode
    const unique = {};
    const out = [];
    resolved.forEach(u => {
      if (!u || !u.idCode) return;
      if (!unique[u.idCode]) { unique[u.idCode] = true; out.push(u); }
    });
    Logger.log("_resolveRecipients resolved %d recipients", out.length);
    return out;
  } catch (e) {
    Logger.log("_resolveRecipients error: " + e);
    return [];
  }
}

// markAnnouncementRead(userId, announcementId) -> update unreadMap in sheet to remove userId
function markAnnouncementRead(userId, announcementId) {
  try {
    if (!userId || !announcementId) return { success:false, message: "Missing parameters." };
    const sh = _sheet("Announcements");
    const data = sh.getDataRange().getValues();
    // find row where col1 == announcementId
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = row[0];
      if (id === announcementId) {
        let unread = {};
        try {
          unread = row[8] ? JSON.parse(row[8]) : {};
        } catch (e) { unread = {}; }
        if (unread && unread[userId]) {
          delete unread[userId];
          sh.getRange(i+1, 9).setValue(JSON.stringify(unread)); // column 9 is unreadMap (1-based)
          Logger.log("markAnnouncementRead: user %s read announcement %s", userId, announcementId);
        }
        return { success: true };
      }
    }
    return { success: false, message: "Announcement not found." };
  } catch (err) {
    Logger.log("markAnnouncementRead error: " + err);
    return { success: false, message: "Failed to mark read." };
  }
}

// ---------- Misc / Admin helpers ----------
/*
  getAttendanceReport(eventName) - extended report for admins (not requested for final UI but useful)
  This function scans Master Attendance Log and returns present/late/absent/excused lists
*/
function getAttendanceReport(eventName) {
  try {
    const sh = _sheet("Master Attendance Log");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: true, data: { present: [], late: [], absent: [], excused: [], totalOfficers: 0 } };

    const groups = _getAttendanceEventGroups();
    let group = groups.find(g => g.name.toLowerCase() === (eventName||"").toLowerCase());
    if (!group) group = groups[groups.length - 1];
    const present = [], late = [], absent = [], excused = [];
    for (let r = 1; r < data.length; r++) {
      const name = (data[r][1] || "").toString().trim();
      const inVal = (data[r][group.inCol - 1] || "").toString().trim();
      if (!inVal) {
        absent.push(name);
      } else if (inVal.startsWith("Late")) {
        late.push(name);
      } else if (inVal.startsWith("Excused")) {
        excused.push(name);
      } else {
        present.push(name);
      }
    }
    return { success: true, data: { present, late, absent, excused, totalOfficers: data.length - 1 } };
  } catch (err) {
    Logger.log("getAttendanceReport error: " + err);
    return { success: false, message: "Failed to generate report." };
  }
}

// ---------- Debug / convenience ----------
/*
  Utility callable from client if needed:
  - ping() -> returns timestamp
*/
function ping() {
  return { ts: _nowString(), ok: true };
}
