// Saves options to chrome.storage
const saveOptions = () => {
    const naming = document.getElementById('namingConvention').value;
    const percentage = document.getElementById('showPercentage').checked;

    chrome.storage.sync.set(
        { namingStyle: naming, includePercentage: percentage },
        () => {
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => { status.textContent = ''; }, 750);
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        { namingStyle: 'full', includePercentage: true }, // Defaults
        (items) => {
            document.getElementById('namingConvention').value = items.namingStyle;
            document.getElementById('showPercentage').checked = items.includePercentage;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);