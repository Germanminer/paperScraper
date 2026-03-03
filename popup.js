// Function to load settings from storage and apply to UI
async function loadSettings() {
    const settings = await chrome.storage.sync.get({
        namingStyle: 'full',      // Default value
        includePercentage: true,   // Default value
        reminders:[1440], //Default value - day before
    });

    document.getElementById('namingConvention').value = settings.namingStyle;
    document.getElementById('showPercentage').checked = settings.includePercentage;
    const checkboxes =document.querySelectorAll('.reminder-check');
    checkboxes.forEach(checkbox => {
        checkbox.checked = settings.reminders.includes(parseInt(checkbox.value));
    })
}
// Function to save settings
function saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value });
}
// Initialize settings when popup opens
document.addEventListener('DOMContentLoaded', loadSettings);
// Listen for UI changes and save immediately
document.getElementById('namingConvention').addEventListener('change', (e) => {
    saveSetting('namingStyle', e.target.value);
});
document.getElementById('showPercentage').addEventListener('change', (e) => {
    saveSetting('includePercentage', e.target.checked);
});
document.getElementById('reminder-options').addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.reminder-check');
    const selectedReminders = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    saveSetting('reminders', selectedReminders);
});
//Popup code starts


document.getElementById("scan").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: "scanAssessments" });
});

document.getElementById("name").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id,{ action: "scanClassName" });
});

document.getElementById("add").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
            // This runs INSIDE each frame
            if (typeof scanAssessments === 'function') {
                const data = scanAssessments();
                const className = scanClassName(); // Get name from the SAME frame
                return data.length > 0 ? { data, className, title: document.title } : null;
            }
            return null;
        }
    });

    const validResults = results.filter(r => r.result !== null).map(r => r.result);

    if (validResults.length === 0) {
        alert("No assessments found on this page.");
        return;
    }

    let selected;
    if (validResults.length > 1) {
        const options = validResults.map((r, i) =>
            `${i + 1}: ${r.className || 'Unknown'} - ${r.title} (${r.data.length} items)`
        ).join('\n');

        const choice = prompt(`Multiple tables found. Enter number (1-${validResults.length}):\n${options}`);
        selected = validResults[parseInt(choice) - 1];
    } else {
        selected = validResults[0];
    }

    if (selected) {
        const settings = await chrome.storage.sync.get({
            namingStyle: 'full',
            includePercentage: true,
            reminders: [1440],
        });

        // Send everything we already gathered to the background script
        chrome.runtime.sendMessage({
            action: "executeCalendarAdd",
            data: selected.data,
            name: selected.className || "Course",
            settings: settings
        });
        console.log("Sent to background:", selected.className);
    }
});
