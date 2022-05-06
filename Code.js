/* Route
 * All Request with Method GET will be process here
 */
let email = Session.getActiveUser().getEmail();
let ldap = email.split("@")[0];

function getEmail (){
  return Session.getActiveUser().getEmail();
}

function generateGUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
    }
    return 'case' + '-' + s4() + '-' + s4();
}

function yyyymm() {
  let now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() + 1;
  return '' + y + "-" + (m < 10 ? '0' : '') + m ;
}

function dateAdd(date, interval, units) {
  let ret = new Date(date); //don't change original date
  let checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
  switch(interval.toLowerCase()) {
    case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
    case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
    case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
    case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    default       :  ret = undefined;  break;
  }
  return ret;
}

function doPost(req){
  const TAB = "All Cases";
  const DB = SpreadsheetApp.openById("1vS_Bok6_ugQmwimCdEYe8WiOVstO28bcs8lOXQPc5QE");
  const ALL_CASES_TAB = DB.getSheetByName(TAB);

  const body = req.postData.contents;
  const bodyJSON = JSON.parse(body);
  let { action,bucketNumber } = req.parameter;


  if (action == 'insert') {
    return doModifiedInsert(bodyJSON, ALL_CASES_TAB);

    // const response  = [{status: 200, message: "OK"}];
  } else {
    console.log('Error: action is: ', action)
  }

  // return sendJSON_(response);
}

function sendJSON_(jsonResponse){
  return ContentService
    .createTextOutput(JSON.stringify(jsonResponse))
    .setMimeType(ContentService.MimeType.JSON);
}
/////////////////

function doGet(req) {
  console.log(ldap,req)
  var action = req.parameter.action;
  var tab = "All Cases";
  if (req.parameter.tab) {
    tab = req.parameter.tab;
  }

  // Contingency Tracker 3
  // 1vS_Bok6_ugQmwimCdEYe8WiOVstO28bcs8lOXQPc5QE
  var db = SpreadsheetApp.openById("1vS_Bok6_ugQmwimCdEYe8WiOVstO28bcs8lOXQPc5QE");
  
  // Don't forget to change your Sheet Name by default is 'Sheet1'
  var sheetUsers = db.getSheetByName(tab);
   
   switch(action) {
       case "read":
           return doRead(req, sheetUsers);
           break;
       case "insert":
           return doInsert(req, sheetUsers);
           break;
       case "update":
           return doUpdate(req, sheetUsers);
           break;
       case "delete":
           return doDelete(req, sheetUsers);
           break;
       default:
           return response().json({
              status: false,
              message: 'silent!'
           });
   }
}

/* Read
 * request for all Data
 *
 * @request-parameter | action<string>
 * @example-request | ?action=read
 */
function doRead(request, sheetObject) {
   var data = {};
   
   data.records = _readData(sheetObject);
   data.user = {
     email: email,
     ldap: ldap
   }

   return response().json(data);

}

/* Insert
 *
 */
function doInsert(req, sheet) {
  console.log(req.parameter)
   var referenceID = generateGUID(),
       reviewStatus = req.parameter.reviewStatus,
       caseID = req.parameter.caseID.toString(),
       queueType = req.parameter.queueType,
       customerType = req.parameter.customerType,
       tool = req.parameter.tool,
       language = req.parameter.language,
       timesReviewed = req.parameter.timesReviewed,
       numberOfQuestions = req.parameter.numberOfQuestions,
       country = req.parameter.country,
       RMTO = "",
       surveyType = req.parameter.surveyType,
       screenshot = req.parameter.screenshot,
       surveyDecision = req.parameter.surveyDecision,
       startTimeMNL = req.parameter.startTimeMNL,
       startTimePST = dateAdd(new Date(startTimeMNL), "hour", -15),
       endTimeMNL = req.parameter.endTimeMNL,
       endTimePST = dateAdd(new Date(endTimeMNL), "hour", -15),
       categories = req.parameter.categories,
       AHT = req.parameter.AHT,
       numberOfInteractions = req.parameter.numberOfInteractions,
       yearMonth = yyyymm();
  
   var flag = 1;
  
   if (flag == 1) {
      var timestamp = Date.now();
      var currentTime = new Date().toLocaleString(); // Full Datetime
      var rowData = sheet.appendRow([
         ldap,
         reviewStatus,
         referenceID,
         caseID,
         queueType,
         customerType,
         tool,
         language,
         country,
         timesReviewed,
         RMTO,
         surveyType,
         screenshot,
         surveyDecision,
         startTimeMNL,
         startTimePST,
         endTimeMNL,
         endTimePST,
         categories,
         AHT,
         numberOfQuestions,
         numberOfInteractions,
         yearMonth
      ]);
      var result = "Insertion successful";
   }

   return response().json({
      result: result
   });
}

function doModifiedInsert(req, sheet) {
  // console.log(req.parameter)
   var referenceID = generateGUID(),
       reviewStatus = req.reviewStatus,
       caseID = req.caseID.toString(),
       queueType = req.queueType,
       customerType = req.customerType,
       tool = req.tool,
       language = req.language,
       timesReviewed = req.timesReviewed,
       numberOfQuestions = req.numberOfQuestions,
       country = req.country,
       RMTO = "",
       surveyType = req.surveyType,
       targeting = req.targeting,
       screenshot = req.screenshot,
       surveyDecision = req.surveyDecision,
       startTimeMNL = req.startTimeMNL,
       startTimePST = dateAdd(new Date(startTimeMNL), "hour", -15),
       endTimeMNL = req.endTimeMNL,
       endTimePST = dateAdd(new Date(endTimeMNL), "hour", -15),
       categories = req.categories,
       AHT = req.AHT,
       numberOfInteractions = req.numberOfInteractions,
       yearMonth = yyyymm();
  
   var flag = 1;
  
   if (flag == 1) {
      var timestamp = Date.now();
      var currentTime = new Date().toLocaleString(); // Full Datetime
      var rowData = sheet.appendRow([
         ldap,
         reviewStatus,
         referenceID,
         caseID,
         queueType,
         customerType,
         tool,
         language,
         country,
         timesReviewed,
         RMTO,
         surveyType,
         screenshot,
         surveyDecision,
         startTimeMNL,
         startTimePST,
         endTimeMNL,
         endTimePST,
         categories,
         AHT,
         numberOfQuestions,
         numberOfInteractions,
         yearMonth,
         targeting
      ]);
      var result = "Insertion successful";
   }

   return response().json({
      result: result
   });
}

/* Update
 * request for Update
 *
 * @request-parameter | id<string>, data<JSON>, action<string>
 * @example-request | ?id=1&action=update&data={"email":"test@gmail.com", "username":"testid"}
 */
function doUpdate(req, sheet) 
{
   var id = req.parameter.id;
   var updates = JSON.parse(req.parameter.data);
  
   var lr = sheet.getLastRow();

   var headers = _getHeaderRow(sheet);
   var updatesHeader = Object.keys(updates);
   
   // Looping for row
   for (var row = 1; row <= lr; row++) {
      // Looping for available header / column
      for (var i = 0; i <= (headers.length - 1); i++) {
         var header = headers[i];
         // Looping for column need to updated
         for (var update in updatesHeader) {
            if (updatesHeader[update] == header) {
               // Get ID for every row
               var rid = sheet.getRange(row, 1).getValue();

               if (rid == id) {
                  // Lets Update
                  sheet.getRange(row, i + 1).setValue(updates[updatesHeader[update]]);
               }
            }
         }
      }
   }

   
   // Output
   return response().json({
      status: true,
      message: "Update successfully"
   });
}


/* Delete
 *
 */
function doDelete(req, sheet) {
   var id = req.parameter.id;
   var flag = 0;

   var Row = sheet.getLastRow();
   for (var i = 1; i <= Row; i++) {
      var idTemp = sheet.getRange(i, 3).getValue();
      if (idTemp == id) {
         sheet.deleteRow(i);
         
         var result = "deleted successfully";
         flag = 1;
      }

   }

   if (flag == 0) {
      return response().json({
         status: false,
         message: "ID not found"
      });
   }

   return response().json({
      status: true,
      message: result
   });
}


/* Service
 */
function _readData(sheetObject, properties) {

   if (typeof properties == "undefined") {
      properties = _getHeaderRow(sheetObject);
      properties = properties.map(function (p) {
//         return p.replace(/\s+/g, '_');
        return p;
      });
   }

   var rows = _getDataRows(sheetObject),
      data = [];

   for (var r = 0, l = rows.length; r < l; r++) {
      var row = rows[r],
          record = {};

      for (var p in properties) {
         record[properties[p]] = row[p];
      }

      data.push(record);
   }
   
   return data;
}
function _getDataRows(sheetObject) {
   var sh = sheetObject;

   return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}
function _getHeaderRow(sheetObject) {
   var sh = sheetObject;

   return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}
function response() {
   return {
      json: function(data) {
         return ContentService
            .createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
      }
   }
}