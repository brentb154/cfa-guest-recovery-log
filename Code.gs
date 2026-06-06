// ------------ Google Sheets Web-App backend for Heard Log -------------
// Field aliases let the frontend send “phone” & “timestamp” while the sheet
// stores “phoneNumber” & “dateSubmitted”.
const FIELD_ALIASES = {
    phoneNumber: 'phone',
    dateSubmitted: 'timestamp'
  };
  
  // YOUR sheet details
  const SHEET_ID   = 'YOUR_SHEET_ID';   // SETUP: paste your Google Sheet ID here (see SETUP_GUIDE.md, Step 2)
  const SHEET_NAME = 'Sheet1';

  // Column order written on first-time setup (also auto-built on first submit).
  const HEADERS = ['id','phone','guestName','orderNumber','orderType','issueType',
                   'resolution','notes','dateOccurred','timestamp',
                   'managerName','dayPart','resolved'];

  // ----------------------------------------------------------------------
  // FIRST-TIME SETUP
  // Run this ONCE in the Apps Script editor after pasting your SHEET_ID above.
  // It wires everything together: data tab, header row, and alert storage.
  // Idempotent — safe to re-run. It never overwrites or deletes existing data.
  // ----------------------------------------------------------------------
  function runFirstTimeSetup() {
    if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID') {
      throw new Error('Set SHEET_ID at the top of this file before running setup.');
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);

    // 1) Make sure the data tab exists (create it if it's missing)
    let sheet = ss.getSheetByName(SHEET_NAME);
    const tabCreated = !sheet;
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    // 2) Make sure the header row exists — but don't touch a sheet that already has data
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const hasHeaders = firstRow[0] === 'id';
    if (!hasHeaders) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    // 3) Initialize alert-email storage (only if it has never been set)
    const props = PropertiesService.getScriptProperties();
    const emailsInit = props.getProperty('alertEmails') === null;
    if (emailsInit) props.setProperty('alertEmails', '[]');

    SpreadsheetApp.flush();

    const msg =
      'H.E.A.R.D. Log setup complete.\n\n' +
      'Spreadsheet : ' + ss.getName() + '\n' +
      'Data tab    : ' + SHEET_NAME + (tabCreated ? '  (created)' : '  (already existed)') + '\n' +
      'Headers     : ' + (hasHeaders ? 'already present — left as-is' : 'written') + '\n' +
      'Alert emails: ' + (emailsInit ? 'initialized' : 'already configured') + '\n\n' +
      'NEXT STEP: Deploy ▸ New deployment ▸ Web app\n' +
      '  • Execute as: Me\n' +
      '  • Who has access: Anyone\n' +
      'Then copy the web app URL into index.html (APPS_SCRIPT_URL). See SETUP_GUIDE.md Step 4.';

    Logger.log(msg);
    return msg;
  }


  // ----------------------------------------------------------------------
  // GET  handler
  function doGet(e) {
    try {
      const action = e && e.parameter && e.parameter.action;
  
      if (action === 'checkPhone') {
        return handleCheckPhone(e);
      }
  
      if (action === 'getEmailSettings') {
        return outputJson({ emails: readAlertEmails() });
      }
  
      // default / action=getAll  -> return all complaints
      return outputJson({
        success: true,
        data: readAllComplaintsNormalized()
      });
  
    } catch (err) {
      return outputError(err);
    }
  }
  
  // ----------------------------------------------------------------------
  // POST handler
  function doPost(e) {
    try {
      const request = JSON.parse(e.postData.contents);
      const action  = request.action || 'add';
  
      switch (action) {
        case 'add':
        case 'submit':                 // <— matches frontend
          return addComplaint(request);
  
        case 'update':
          return updateComplaint(request);
  
        case 'delete':
          return deleteComplaint(request);
  
        case 'toggleResolved':
          return toggleResolved(request);
  
        case 'getEmailSettings':       // allow POST too
          return outputJson({ emails: readAlertEmails() });
  
        case 'addEmail':
          return addEmail(request);
  
        case 'removeEmail':
          return removeEmail(request);
  
        default:
          throw new Error('Unknown action: ' + action);
      }
  
    } catch (err) {
      return outputError(err);
    }
  }
  
  // ----------------------------------------------------------------------
  //  ADD new complaint
  function addComplaint(c) {
    const sheet   = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const values  = sheet.getDataRange().getValues();
    const headers = values.length ? values[0] : [];
  
    const id        = c.id        || Utilities.getUuid();
    const timestamp = c.timestamp || new Date().toISOString();
    const resolved  = typeof c.resolved === 'boolean' ? c.resolved : false;
  
    // Build row aligned to headers (use aliases)
    const row = headers.map(h => {
      const src = c.hasOwnProperty(h) ? h : FIELD_ALIASES[h];
      if (h === 'id')          return id;
      if (h === 'timestamp' ||
          h === 'dateSubmitted') return timestamp;
      if (h === 'resolved')    return resolved;
      return src && c[src] !== undefined ? c[src] : '';
    });
  
    // If sheet empty, initialize a default header row
    if (!headers.length || (headers.length === 1 && headers[0] === '')) {
      const defaultHeaders =
        ['id','phone','guestName','orderNumber','orderType','issueType',
         'resolution','notes','dateOccurred','timestamp',
         'managerName','dayPart','resolved'];
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
      sheet.appendRow([
        id,
        c.phone || '',
        c.guestName || '',
        c.orderNumber || '',
        c.orderType || '',
        c.issueType || '',
        c.resolution || '',
        c.notes || '',
        c.dateOccurred || '',
        timestamp,
        c.managerName || '',
        c.dayPart || '',
        resolved
      ]);
    } else {
      sheet.appendRow(row);
    }
  
    return outputJson({ success: true, message: 'Complaint added successfully' });
  }
  
  // ----------------------------------------------------------------------
  // UPDATE existing complaint
  function updateComplaint(data) {
    const sheet     = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const allData   = sheet.getDataRange().getValues();
    const headers   = allData[0];
    const idIndex   = headers.indexOf('id');
    const rowIndex  = allData.findIndex((r,i) => i>0 && r[idIndex] === data.id);
  
    if (rowIndex === -1) throw new Error('Complaint not found');
  
    const rowVals = headers.map(h => {
      const src = data.hasOwnProperty(h) ? h : FIELD_ALIASES[h];
      if (h === 'id')       return data.id;
      if (h === 'resolved') return typeof data.resolved === 'boolean' ? data.resolved : false;
      return src && data[src] !== undefined ? data[src] : '';
    });
  
    sheet.getRange(rowIndex+1,1,1,headers.length).setValues([rowVals]);
    return outputJson({ success:true, message:'Complaint updated successfully' });
  }
  
  // ----------------------------------------------------------------------
  // DELETE complaint
  function deleteComplaint(data) {
    const sheet     = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const allData   = sheet.getDataRange().getValues();
    const headers   = allData[0];
    const idIndex   = headers.indexOf('id');
    const rowIndex  = allData.findIndex((r,i)=>i>0 && r[idIndex]===data.id);
    if (rowIndex===-1) throw new Error('Complaint not found');
    sheet.deleteRow(rowIndex+1);
    return outputJson({ success:true, message:'Complaint deleted successfully' });
  }
  
  // ----------------------------------------------------------------------
  // TOGGLE resolved
  function toggleResolved(data) {
    const sheet     = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const allData   = sheet.getDataRange().getValues();
    const headers   = allData[0];
    const idIndex   = headers.indexOf('id');
    const resIndex  = headers.indexOf('resolved');
    const rowIndex  = allData.findIndex((r,i)=>i>0 && r[idIndex]===data.id);
    if (rowIndex===-1) throw new Error('Complaint not found');
    const newVal = typeof data.resolved === 'boolean'
                 ? data.resolved
                 : !allData[rowIndex][resIndex];
    sheet.getRange(rowIndex+1,resIndex+1).setValue(newVal);
    return outputJson({ success:true, message:'Resolved status toggled' });
  }
  
  // ----------------------------------------------------------------------
  // EMAIL settings helpers
  function readAlertEmails() {
    const props = PropertiesService.getScriptProperties();
    return JSON.parse(props.getProperty('alertEmails') || '[]');
  }
  function addEmail(d) {
    const emails = readAlertEmails();
    if (emails.includes(d.email)) throw new Error('Email already exists');
    emails.push(d.email);
    PropertiesService.getScriptProperties().setProperty('alertEmails',JSON.stringify(emails));
    return outputJson({ success:true, message:'Email added' });
  }
  function removeEmail(d) {
    const emails = readAlertEmails().filter(e=>e!==d.email);
    PropertiesService.getScriptProperties().setProperty('alertEmails',JSON.stringify(emails));
    return outputJson({ success:true, message:'Email removed' });
  }
  
  // ----------------------------------------------------------------------
  // GET helpers
  function readAllComplaintsNormalized() {
    const sheet   = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const values  = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    const headers = values[0];
    return values.slice(1).map(row => {
      const o={}; headers.forEach((h,i)=>o[h]=row[i]); return normalize(o);
    });
  }
  function normalize(raw) {
    return {
      id:          raw.id,
      phone:       raw.phone!==undefined ? raw.phone : raw.phoneNumber,
      guestName:   raw.guestName,
      orderNumber: raw.orderNumber,
      orderType:   raw.orderType,
      issueType:   raw.issueType,
      resolution:  raw.resolution,
      notes:       raw.notes,
      dateOccurred:raw.dateOccurred,
      timestamp:   raw.timestamp!==undefined ? raw.timestamp : raw.dateSubmitted,
      managerName: raw.managerName,
      dayPart:     raw.dayPart,
      resolved:    !!raw.resolved
    };
  }
  
  function handleCheckPhone(e) {
    const phone = (e.parameter && e.parameter.phone) || '';
    if (!phone) return outputJson({ count:0, complaints:[] });
  
    const all      = readAllComplaintsNormalized();
    const now      = new Date();
    const cutoff   = new Date(now.getTime() - 60*24*60*60*1000); // 60 days
    const recent   = all.filter(c=>{
      if (String(c.phone)!==String(phone)) return false;
      const d=new Date(c.timestamp); return !isNaN(d) && d>=cutoff;
    }).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  
    return outputJson({ count: recent.length, complaints: recent });
  }
  
  // ----------------------------------------------------------------------
  // Utility output helpers
  function outputJson(obj){
    return ContentService
           .createTextOutput(JSON.stringify(obj))
           .setMimeType(ContentService.MimeType.JSON);
  }
  function outputError(err){
    return outputJson({ success:false, error:err.toString() });
  }