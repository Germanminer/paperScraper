chrome.runtime.onMessage.addListener(async (msg, sender) => {
    if (msg.action === "dataScanned") {
        console.log("DATA SCANNED")
        console.log(msg.data)
    } else if (msg.action === "executeCalendarAdd") {
        const { data, name, settings } = msg;

        // Initialize counters for each letter
        const letterCounters = {};

        const calendarEvents = data.map((task) => {
            let title = "";
            const rawDate = new Date(task.date);
            const isoDate = rawDate.toISOString();
            if (settings.namingStyle === "index") {
                // Get the first letter (e.g., 'A' from 'Assignment')
                const firstLetter = task.name[0].toUpperCase();

                // Increment counter for this specific letter
                letterCounters[firstLetter] = (letterCounters[firstLetter] || 0) + 1;

                // Result: "COMP101 - A1"
                title = `${name} - ${firstLetter}${letterCounters[firstLetter]}`;
            } else {
                title = `${name} - ${task.name}`;
            }

            return {
                summary: title,
                description: settings.includePercentage ? `Weight: ${task.percentage}` : "",
                start: { dateTime: isoDate },
                end: { dateTime: isoDate },
                reminders:{
                    useDefault:false,
                    overrides : settings.reminders.map(mins=>({
                        method:"popup",
                        minutes:mins
                    }))
                }
            };
        });

        console.log("Ready to add with settings:", settings, calendarEvents);
    }else if (msg.action === "testAuth") {
        console.log("Attempting to get Auth Token...");

        // interactive: true will force the Google Login popup if not logged in
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError) {
                console.error("Auth Error:", chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("Success! Token received:", token);
                sendResponse({ success: true, token: token });
            }
        });
        return true; // Keep channel open for async response
    }
});