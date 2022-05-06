//Function for including external files into html
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
  .getContent();
}

function doGet(e) {
  Logger.log( Utilities.jsonStringify(e) );
  if (!e.parameter.page) {
    // When no specific page requested, return "home page"
    if(e.parameter.caseID != null) {
      var htmlTemplate = HtmlService.createTemplateFromFile('response');
    }
    else
      var htmlTemplate = HtmlService.createTemplateFromFile('index');
    
    var htmlOutput = htmlTemplate.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl("https://i.imgur.com/misqTMk.png")
    .setTitle('QM Dashboard');
    
    // appendDataToHtmlOutput modifies the html and returns the same htmlOutput object
    return htmlOutput;
  }
  // else, use page parameter to pick an html file from the script
  return HtmlService.createTemplateFromFile(e.parameter['page']).evaluate()
  .setSandboxMode(HtmlService.SandboxMode.IFRAME).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}