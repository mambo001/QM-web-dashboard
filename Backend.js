// SPR DUMP
// Testing
const SPR_DUMP = SpreadsheetApp.openById("1D0sp2Ay6fBqqGu5HTwRmhAVtJJy7dUQ0nUrYxIZDcXU");
// // Production
// const SPR_DUMP = SpreadsheetApp.openById("1k2jLrOAeCG3vvCxX1xm205fztiXoAEuFuqPDGJk3Ln4");
// Tab Name
const MONITOR_LOGS_TAB = SPR_DUMP.getSheetByName("Monitor Logs");

// QM MAIN DUMP
const QM_Dump = SpreadsheetApp.openById("12OdxpPwNiu_XJOSuRqk_QJpYFOgEfN9EEuxYPfQWDmI");
const SPR_tab = QM_Dump.getSheetByName("SPR-AR");
const QMPrio_tab = QM_Dump.getSheetByName("QM - Prio");

function getMonitoringLogsData() {
  let data = {};
  data.cases = _readData(SPR_tab);
  console.log(SPR_tab)
  console.log(data.cases);

  return JSON.stringify(data);
}

// function getPrioData(){
//   let data = {};
//   let array = _readData(QMPrio_tab);
//   let filteredArray = array.filter(p => p.LDAP != '')
//   data.prio = filteredArray
//   console.log(data.prio);

//   return JSON.stringify(data);
// }

function getPrioData(){
  let data = {};
  let array = _readData(QMPrio_tab);
  let filteredArray = array
    .filter(({ LDAP, 'Override Status':overrideStatus, 'Status':originalStatus }) => {
      if (overrideStatus == 'CASES') return LDAP
      if (overrideStatus == '') {
        if (originalStatus == 'CASES' || originalStatus == 'AVAIL') return LDAP
      }
      
    })
    .sort((a, b) => a.MTD - b.MTD);
  data.prio = filteredArray
  // console.log(data.prio);

  return JSON.stringify(data);
}

function getUnprocessedCases(){
  const cutOffLastFive = (array) => {
    const [...rest] = array;
    return rest.slice(-30);
  }
  const uniqueResult = arr => {
    const seen = {}
    let out = []
    for (let v of arr) {
      if (!seen[v["ldap"]]) {
        seen[v["ldap"]] = true
        out.push(v)
      }
    }
    return out
  }
  let data = {};
  let array = _readData(SPR_tab);
  let recentCasesArray = cutOffLastFive(array);
  let filteredArray = recentCasesArray.filter(p => p.Status == '' & p.Remarks != 'Duplicate')

  const result = uniqueResult(filteredArray
    .map(c => ({
      ldap: c["Assigned To"],
      caseIDArray: filteredArray
        .filter(d => d["Assigned To"] === c["Assigned To"])
          .map(({ 'Case ID':caseID }) => caseID)
          .flat(),
      assignedCases: filteredArray
        .filter(d => d["Assigned To"] === c["Assigned To"])
        .length
    })
  ));

  console.log(result)

  data.unassignedCases = result

  // console.log(array.length, recentCasesArray.length, data.cases.length)
  // console.log(data);

  return JSON.stringify(data);
}

function doUpdateStatus(req) {
  // TESTING
  let { id, action } = JSON.parse(req)

  let data = QMPrio_tab.getRange("A:G").getValues();
  let filteredMofo = data.filter(e => e != '' || e == null);
  let ldapList = filteredMofo.map(e => e[0].toString().toLowerCase());
  let statusList = filteredMofo.map(e => e[5].toString().toLowerCase());

  let posIndex = ldapList.indexOf(id.toString().toLowerCase());
  let rowNumber = posIndex === -1 ? 0 : posIndex + 1;

  console.log(posIndex,rowNumber);

  // Edit operation
  QMPrio_tab.getRange(rowNumber, 6, 1, 1).setValue(action)

  // Value changed checker
  let updatedStatus = QMPrio_tab.getRange(rowNumber, 6, 1, 1).getValues();
  console.log(updatedStatus);

  return JSON.stringify({
    message: 'Updated sucessfully',
    operationCode: 202,
    newValue: updatedStatus
  })
  
}

function _doFindCaseIDPosition(id){
  // id = '4-6273000030939'
  let searchKeyword = id;
  let caseIDArray = MONITOR_LOGS_TAB
      .getRange(2, 6, MONITOR_LOGS_TAB.getLastRow()-1, 1)
      .getValues()
      .map(r => r[0].toString().toLowerCase());
  let posIndex = caseIDArray.indexOf(searchKeyword.toString().toLowerCase());
  let rowNumber = posIndex === -1 ? 0 : posIndex + 2;
  console.log(rowNumber, posIndex)
  return rowNumber;
}

function _doFindLDAPPosition(id){
  // id = 'reubenmark'
  let searchKeyword = id;
  let QMPrioData = QMPrio_tab
      .getRange("A2:G")
      .getValues();
  let LDAPArray = QMPrioData.map(r => r[0].toString().toLowerCase());
  let QMMTDArray = QMPrioData.map(r => r[2].toString().toLowerCase());
  let posIndex = LDAPArray.indexOf(searchKeyword.toString().toLowerCase());
  let rowNumber = posIndex === -1 ? 0 : posIndex + 2;
  let rowValues = QMPrioData[posIndex]
  console.log(searchKeyword,posIndex, rowNumber, rowValues)
  return JSON.stringify({
    rowNumber,
    rowValues
  });
}



function doUpdateCaseState(req){
  let result;
  let {caseID, caseStatus} = req.parameter;
  let rowNumber = _doFindCaseIDPosition(caseID);
  let newCaseStatus = [[caseStatus]];

  // TEST - Check Case status current value
  // let caseStatus = MONITOR_LOGS_TAB.getRange(rowNumber, 8, 1 ,1).getValues();
  // console.log(caseStatus);

  
  console.log(rowNumber, caseID, caseStatus);
  
  MONITOR_LOGS_TAB.getRange(rowNumber, 8, 1, 1).setValues(newCaseStatus);
  result = "Updated successfully";

  // Test
  let updatedStatus = MONITOR_LOGS_TAB.getRange(rowNumber, 8, 1, 1).getValues();
  console.log(updatedStatus);

  return response().json({
    status: true,
    message: result
  });
}

function doDeductPrio(arr) {
  // PROD
  if (!arr.length) return
  console.log(arr)
  const tallyArray = JSON.parse(arr);

  tallyArray.forEach(({ ldap, 'assignedCases':count }) => {
    if(!ldap) return
    const LDAPRowData = _doFindLDAPPosition(ldap);
    const { rowNumber,rowValues } = JSON.parse(LDAPRowData);
    const [ ,currentMTD,QMMTD,MTD,...rest ] = rowValues;
    const subtractValues = (currentValue, newValue) => (currentValue - newValue);
    const finalValue = subtractValues(QMMTD, count);

    // Edit operation
    QMPrio_tab.getRange(rowNumber, 3, 1, 1).setValue(finalValue)
  });

  // Value changed checker
  // updatedCount = QMPrio_tab.getRange("A2:G").getValues();
  // console.log(updatedCount);

  return JSON.stringify({
    message: 'Updated sucessfully',
    operationCode: 202
  })
}

function doAddPrio(arr) {
  // PROD
  if (!arr.length) return
  console.log(arr)
  const tallyArray = JSON.parse(arr);

  tallyArray.forEach(({ ldap, 'assignedCases':count }) => {
    if(!ldap) return
    const LDAPRowData = _doFindLDAPPosition(ldap);
    const { rowNumber,rowValues } = JSON.parse(LDAPRowData);
    const [ ,currentMTD,QMMTD,MTD,...rest ] = rowValues;
    const sumValues = (currentValue, newValue) => (currentValue + newValue);
    const finalValue = sumValues(QMMTD, count);

    // Edit operation
    QMPrio_tab.getRange(rowNumber, 3, 1, 1).setValue(finalValue)
  });

  // Value changed checker
  // updatedCount = QMPrio_tab.getRange("A2:G").getValues();
  // console.log(updatedCount);

  return JSON.stringify({
    message: 'Updated sucessfully',
    operationCode: 202
  })
}

function doDeleteLDAPAssignment(arr) {
  // PROD
  if (!JSON.parse(arr).length) return
  console.log(arr)
  const caseIDArray = JSON.parse(arr);
  
  // Testing
  // const caseIDArray = ['1-6473000031421','9-1354000031395','6-3845000030848'];

  caseIDArray.forEach(e => {
    let rowNumber = _doFindCaseIDPosition(e);

    // Clear LDAP cell value
    MONITOR_LOGS_TAB.getRange(rowNumber, 5, 1, 1).setValue('');
  })

  return JSON.stringify({
    message: 'Updated sucessfully',
    operationCode: 202
  })
}

function autoAssignCases(){
  // Unassigned Cases
  const { unassignedCases } = JSON.parse(getUnprocessedCases());
  const caseIDArray = unassignedCases.map(e => e['caseIDArray']).flat();

  // Prio LDAPs
  const { 'prio':prioData } = JSON.parse(getPrioData());
  const prioArray = prioData.map(e => e['LDAP']);
  const prioLDAP = [
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray,
          prioArray
      ].flat()

  // Case Assignment
  // caseIDArray -> prioLDAP
  const doAssign = (casesArray, prioArray) => {
    // console.log(casesArray)
    // console.log(prioArray)
    let assignedCases = casesArray.map((c, index) => {
      return {
        caseID: c,
        ldap: prioArray[index]
      }
    })

    return assignedCases;
  }

  // Setting assigned LDAP in SPR
  const newAssignmentArray = doAssign(caseIDArray, prioLDAP);
  newAssignmentArray.forEach(({caseID, ldap}) => {
    let rowNumber = _doFindCaseIDPosition(caseID);

    MONITOR_LOGS_TAB.getRange(rowNumber, 5, 1, 1).setValue(ldap);
  })
  console.log(newAssignmentArray)

  // Setting QM MTD
  // newAssignmentArray
  const uniqueResult = arr => {
    const seen = {}
      let out = []
      for (let v of arr) {
        if (!seen[v["ldap"]]) {
          seen[v["ldap"]] = true
          out.push(v)
        }
      }
    return out
  }

  const newAssignmentCount = uniqueResult(newAssignmentArray
    .map(c => {
      return {
        ldap: c["ldap"],
        assignedCases: newAssignmentArray
          .filter(d => d["ldap"] === c["ldap"])
          .length
      }
    })
  )

  console.log(newAssignmentCount)

  doAddPrio(JSON.stringify(newAssignmentCount));

  return JSON.stringify({
    message: 'Assigned sucessfully',
    operationCode: 202
  })

}


















// Utility
// Read data
function _readData(sheetObject, properties) {

   if (typeof properties == "undefined") {
      properties = _getHeaderRow(sheetObject);
      properties = properties.map(function (p) {
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
// Update data
function _updateData(req, sheet) {
  console.log(sheet)
  console.log(req)
  let id = req.id;
  // let updates = JSON.parse(req.data);
  let updates = req.data;

  let lr = sheet.getLastRow();

  let headers = _getHeaderRow(sheet);
  let updatesHeader = Object.keys(updates);
  
  // Looping for row
  for (let row = 1; row <= lr; row++) {
    // Looping for available header / column
    for (let i = 0; i <= (headers.length - 1); i++) {
        let header = headers[i];
        // Looping for column need to updated
        for (let update in updatesHeader) {
          if (updatesHeader[update] == header) {
              // Get ID for every row
              let rid = sheet.getRange(row, 1).getValue();

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
