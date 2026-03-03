//# TODO, Add option to choose between two papers when there are two papers

chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
    if (message.action === "scanAssessments") {
        const data = scanAssessments();
        if (data && data.length>0){
            sendResponse({
                data: data,
                origin: window.location.href,
                title: document.title || "Unknown Frame"
            });
        }else{
            sendResponse(null)
        }
        return true;
    }else if (message.action === "scanClassName") {
        const name = scanClassName();
        sendResponse(name);
        return true;
    }
});

function scanAssessments(){
    const tasks = [];
    const tables = document.querySelectorAll("table.assessments");
    if (tables.length === 0) {
        console.error("No tables with class 'assessments' found.");
        return [];
    }
    console.log("Found table here " + window.location);
    const rows = tables[0].querySelectorAll("tbody tr:not(.assessmentCategory)");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        if (cells.length >= 2) {
            const name = cells[0].innerText.trim();
            const date = cells[1].innerText.trim();
            const percentage = cells[2].innerText.trim();
            if(name&&date){
                tasks.push({
                    name: name,
                    date: date,
                    percentage:percentage,
                });
            }

        }
    });

    console.log("Scanned Data:");
    console.table(tasks);

    return tasks;
}
function scanClassName(){
    const element = document.querySelector("title");
    if (!element) return null;
    const nameText = element.innerHTML;
    const className = nameText.trim().split(" ")[0];
    if(!window.location.href.includes("https://paperoutlines.waikato.ac.nz/outline")){
       return null;
    }
    console.log("ClassName:" + className);
    return className;
}