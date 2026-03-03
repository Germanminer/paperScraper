const TARGET_CALENDAR_NAME = "assessments-PaperScraper";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "executeCalendarAdd") {
        const { data, name, settings } = msg;

        chrome.identity.getAuthToken({ interactive: true }, async function(token) {
            if (chrome.runtime.lastError) {
                console.error("Auth Error:", chrome.runtime.lastError.message);
                return;
            }

            try {
                //Check calendar exists
                let targetCalendarId = await findCalendarByName(token, TARGET_CALENDAR_NAME);

                //Create if not exists
                if (!targetCalendarId) {
                    console.log("Calendar not found. Creating...");
                    targetCalendarId = await createNewCalendar(token, TARGET_CALENDAR_NAME);
                }

                console.log(`Using Calendar ID: ${targetCalendarId}`);

                //add the assessments to calendar
                const letterCounters = {};
                const uploadPromises = data.map(task => {
                    const dateObj = new Date(task.date);
                    const isoDate = dateObj.toISOString().split("T")[0];

                    let title = settings.namingStyle === "index"
                        ? `${name} - ${task.name[0].toUpperCase()}${ (letterCounters[task.name[0].toUpperCase()] = (letterCounters[task.name[0].toUpperCase()] || 0) + 1) }`
                        : `${name} - ${task.name}`;

                    const event = {
                        summary: title,
                        description: settings.includePercentage ? `Percentage: ${task.percentage}` : "",
                        start: { date: isoDate, timeZone: 'Pacific/Auckland' },
                        end: { date: isoDate, timeZone: 'Pacific/Auckland' },
                        reminders: {
                            useDefault: false,
                            overrides: (settings.reminders || []).map(mins => ({ method: "popup", minutes: mins }))
                        }
                    };

                    return fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetCalendarId}/events`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(event)
                    });
                });
                await Promise.all(uploadPromises);
                sendResponse({success:true})
                console.log(`Successfully added assessments to ${TARGET_CALENDAR_NAME}!`);

            } catch (err) {
                console.error("Workflow Error:", err);
                sendResponse({success:false,error:err.message})
                console.log("Failed to process calendar request. Check console for details.");
            }
        });
        return true;
    }
});

/** Helper: Find a calendar ID by its summary name **/
async function findCalendarByName(token, name) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const list = await response.json();
    console.log(list);
    const found = list.items.find(cal => cal.summary === name);
    return found ? found.id : null;
}

/** Helper: Create a new secondary calendar **/
async function createNewCalendar(token, name) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: name })
    });
    const newCal = await response.json();
    return newCal.id;
}