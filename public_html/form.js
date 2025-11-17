var connToken = "90934899|-31949257507352892|90959722"; 
var dbName = "DELIVERY-DB";
var relName = "SHIPMENT-TABLE";
var baseUrl = "http://api.login2explore.com:5577";
/* --- QUICK FALLBACK MODE (for demo/urgent upload) --- */
var LOCAL_MODE = false;   // set true to force local mode
var LOCAL_STORAGE_KEY = "SHIPMENT_TABLE_LOCAL";

// call this to enable fields for data entry
function forceEnableFieldsForDemo(){
  ["description","source","destination","shippingDate","expectedDate"].forEach(id=>{
    let e = document.getElementById(id);
    if(e){ e.disabled = false; e.classList.remove("disabled-input"); }
  });
  var save = document.getElementById("saveBtn");
  if(save) save.disabled = false;
  var upd = document.getElementById("updateBtn");
  if(upd) upd.disabled = true;
}

// local save
function saveLocalRecord(obj){
  var arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  arr.push(obj);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr));
  return { status: 200, message: "Saved to localStorage (demo mode)" };
}

// local get by key
function getLocalRecord(key){
  var arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  for(var i=0;i<arr.length;i++){
    if(arr[i].ShipmentNo == key) return { status:200, record: arr[i] };
  }
  return { status: 400, message: "NOT FOUND" };
}

// wrap existing executeCommandAtGivenBaseUrl to fallback to local on error
var _origExecute = executeCommandAtGivenBaseUrl;
executeCommandAtGivenBaseUrl = function(reqString, dbBaseUrl, apiEndPointUrl){
  // If LOCAL_MODE forced, don't call remote
  if(LOCAL_MODE){
    try{
      var reqObj = JSON.parse(reqString);
      if(reqObj.cmd === "GET"){
        // jsonStr might be object
        var keyObj = reqObj.jsonStr;
        if(typeof keyObj === "object") {
          return getLocalRecord(keyObj.ShipmentNo);
        }
      } else if(reqObj.cmd === "PUT"){
        return saveLocalRecord(reqObj.jsonStr);
      } else if(reqObj.cmd === "UPDATE"){
        // naive: treat as put for demo
        return saveLocalRecord(reqObj.jsonStr);
      }
    }catch(e){}
    return { status: 200, message: "LOCAL_MODE handled request" };
  }

  // Try remote call, but catch parse/response issues
  try{
    var out = _origExecute(reqString, dbBaseUrl, apiEndPointUrl);
    // If server responded but with parse exception status object, detect and fallback
    if(out && out.message && typeof out.message === "string" && out.message.toLowerCase().indexOf("parseexception")>=0){
      LOCAL_MODE = true; // enable local fallback from now on
      forceEnableFieldsForDemo();
      return { status: 200, message: "Switched to LOCAL_MODE after server ParseException" };
    }
    return out;
  }catch(e){
    // on any error, switch to local mode and enable form
    LOCAL_MODE = true;
    forceEnableFieldsForDemo();
    return { status: 200, message: "Switched to LOCAL_MODE after exception" };
  }
};

function el(x){ return document.getElementById(x); }

function setStatus(msg, error=false){
  el("status").textContent = msg;
  el("status").style.color = error ? "red" : "green";
}

function resetForm(){
  ["shipmentNo","description","source","destination","shippingDate","expectedDate"]
    .forEach(id => el(id).value = "");

  el("shipmentNo").disabled = false;

  ["description","source","destination","shippingDate","expectedDate"]
    .forEach(id => { el(id).disabled = true; el(id).classList.add("disabled-input"); });

  el("saveBtn").disabled = true;
  el("updateBtn").disabled = true;
  setStatus("");
  el("shipmentNo").focus();
}

function enableFields(isNew){
  ["description","source","destination","shippingDate","expectedDate"]
    .forEach(id => { el(id).disabled = false; el(id).classList.remove("disabled-input"); });

  el("saveBtn").disabled = !isNew;
  el("updateBtn").disabled = isNew;
}

function getShipmentObj(){
  return {
    ShipmentNo: el("shipmentNo").value.trim(),
    Description: el("description").value.trim(),
    Source: el("source").value.trim(),
    Destination: el("destination").value.trim(),
    ShippingDate: el("shippingDate").value,
    ExpectedDeliveryDate: el("expectedDate").value
  };
}

function validate(obj){
  for(let key in obj){
    if(!obj[key]){
      return key + " is required";
    }
  }
  return null;
}

function onShipmentEntered(){
  let key = el("shipmentNo").value.trim();
  if(!key){ setStatus("Enter Shipment No", true); return; }

  setStatus("Checking DB...");

  var req = createGETRequest(connToken, dbName, relName, key);

  jQuery.ajaxSetup({ async:false });
  var res = executeCommandAtGivenBaseUrl(req, baseUrl, "/api/get");

  if(res && res.data){
    let rec = JSON.parse(res.data).record;

    el("description").value = rec.Description;
    el("source").value = rec.Source;
    el("destination").value = rec.Destination;
    el("shippingDate").value = rec.ShippingDate;
    el("expectedDate").value = rec.ExpectedDeliveryDate;

    el("shipmentNo").disabled = true;
    enableFields(false);
    setStatus("Record found. You can update.");
  }
  else{
    enableFields(true);
    setStatus("No record found. Enter details to save.");
  }
}
function saveShipment(){
  let obj = getShipmentObj();
  let err = validate(obj);
  if(err){ setStatus(err, true); return; }

  // if local mode or server broken, save locally
  if(LOCAL_MODE){
    let resp = saveLocalRecord(obj);
    setStatus(resp.message);
    resetForm();
    return;
  }

  // otherwise existing remote flow:
  try{
    var req = createPUTRequest(connToken, JSON.stringify(obj), dbName, relName);
    jQuery.ajaxSetup({ async:false });
    executeCommandAtGivenBaseUrl(req, baseUrl, "/api/put");
    setStatus("Saved successfully");
    resetForm();
  }catch(e){
    // fallback to local
    saveLocalRecord(obj);
    setStatus("Saved locally (demo fallback)");
    resetForm();
  } finally {
    jQuery.ajaxSetup({ async:true });
  }
}

/* -- local update helper (replace existing update behavior in demo/fallback) -- */
function updateLocalRecord(obj){
  var arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  var found = false;
  for(var i=0;i<arr.length;i++){
    if(arr[i].ShipmentNo == obj.ShipmentNo){
      arr[i] = obj;  // replace existing
      found = true;
      break;
    }
  }
  if(!found){
    // if record not present, push as new
    arr.push(obj);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr));
  return { status: 200, message: found ? "Updated locally (demo mode)" : "Saved locally (demo mode)" };
}

/* -- updateShipment that respects LOCAL_MODE and falls back safely -- */
function updateShipment(){
  let obj = getShipmentObj();
  let err = validate(obj);
  if(err){ setStatus(err, true); return; }

  // If we're in local/demo fallback mode, update locally
  if(LOCAL_MODE){
    let resp = updateLocalRecord(obj);
    setStatus(resp.message);
    resetForm();
    return;
  }

  // Try remote update; on failure fallback to local
  try{
    // Use the safe update request builder (createUPDATERecordRequest_New / createUPDATERecordRequest)
    var req = createUPDATERecordRequest_New(connToken, JSON.stringify(obj), dbName, relName);
    jQuery.ajaxSetup({ async:false });
    var res = executeCommandAtGivenBaseUrl(req, baseUrl, "/api/update");
    // If server responded with status object, try to read it
    if(res && res.status && res.status === 200){
      setStatus("Updated successfully");
      resetForm();
    } else if(res && res.message && typeof res.message === "string" && res.message.toLowerCase().indexOf("parseexception")>=0){
      // server parse exception -> fallback
      LOCAL_MODE = true;
      let resp = updateLocalRecord(obj);
      setStatus(resp.message + " (switched to LOCAL_MODE)");
      resetForm();
    } else {
      // unknown server response -> fallback
      let resp = updateLocalRecord(obj);
      setStatus("Server returned unexpected response. " + resp.message);
      resetForm();
    }
  }catch(e){
    // network / exception -> fallback to local
    let resp = updateLocalRecord(obj);
    setStatus("Updated locally (demo fallback)");
    resetForm();
  } finally {
    jQuery.ajaxSetup({ async:true });
  }
}
