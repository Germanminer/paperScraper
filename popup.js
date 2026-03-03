async function loadSettings() {
    const settings = await chrome.storage.sync.get({
        namingStyle: 'full',
        includePercentage: true,
        reminders:[1440],
    });

    document.getElementById('namingConvention').value = settings.namingStyle;
    document.getElementById('showPercentage').checked = settings.includePercentage;
    const checkboxes = document.querySelectorAll('.reminder-check');
    checkboxes.forEach(checkbox => {
        checkbox.checked = settings.reminders.includes(parseInt(checkbox.value));
    });
}

function saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value });
}

document.addEventListener('DOMContentLoaded', loadSettings);

document.getElementById('namingConvention').addEventListener('change', (e) => saveSetting('namingStyle', e.target.value));
document.getElementById('showPercentage').addEventListener('change', (e) => saveSetting('includePercentage', e.target.checked));
document.getElementById('reminder-options').addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.reminder-check');
    const selectedReminders = Array.from(checkboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));
    saveSetting('reminders', selectedReminders);
});

document.getElementById("add").addEventListener("click", async () => {
    const btn = document.getElementById("add");
    btn.innerText = "Searching...";
    btn.disabled = true;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
            if (typeof scanAssessments === 'function') {
                const data = scanAssessments();
                const className = scanClassName();
                return data.length > 0 ? { data, className, title: document.title } : null;
            }
            return null;
        }
    });

    const validResults = results.filter(r => r.result !== null).map(r => r.result);

    if (validResults.length === 0) {
        alert("No assessments found. Make sure you are on a Paper Outline page.");
        btn.innerText = "Find & Add Assessments";
        btn.disabled = false;
        return;
    }

    renderSelectionList(validResults);
    btn.innerText = "Find & Add Assessments";
    btn.disabled = false;
});

function renderSelectionList(results) {
    const container = document.getElementById("results-container");
    const wrapper = document.getElementById("selection-wrapper");
    container.innerHTML = ""; // clear old results
    wrapper.classList.remove("hidden");

    results.forEach((result, index) => {
        const div = document.createElement("div");
        div.className = "result-item";

        const info = document.createElement("span");
        info.innerText = `${result.className || 'Table'} (${result.data.length} items)`;

        const selectBtn = document.createElement("button");
        selectBtn.innerText = "Add";
        selectBtn.className = "select-btn";

        selectBtn.addEventListener("click", async () => {
            selectBtn.disabled = true;
            selectBtn.innerHTML = '<span class="loader"></span>';

            const settings = await chrome.storage.sync.get({
                namingStyle: 'full',
                includePercentage: true,
                reminders: [1440],
            });

            chrome.runtime.sendMessage({
                action: "executeCalendarAdd",
                data: result.data,
                name: result.className || "Course",
                settings: settings
            },(response) => {
                if (response && response.success) {
                    selectBtn.innerText = "Added!";
                    selectBtn.style.backgroundColor = "#28a745";
                } else {
                    selectBtn.innerText = "Error";
                    selectBtn.style.backgroundColor = "#be0000";
                    selectBtn.disabled = false;
                    console.error("Calendar Error:", response?.error);
                }
            });
        });

        div.appendChild(info);
        div.appendChild(selectBtn);
        container.appendChild(div);
    });
}