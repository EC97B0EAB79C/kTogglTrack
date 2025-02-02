const apiKey = process.env.TOGGL_API_KEY;
const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`); 

async function getCurrentTimeEntry() {
    try {
        const response = await fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", {
            headers: { 
                "Content-Type": "application/json",
                "Authorization": auth 
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const entry = await response.json();
        if (!entry) return null;

        const project = await getProject(entry.workspace_id, entry.project_id);
        
        return {
            description: entry.description,
            project: project?.name || "No project",
            color: project?.color || "#000000",
            duration: Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000)
        };
    } catch (err) {
        console.error('Error in getCurrentTimeEntry:', err.message);
        throw err;
    }
}

async function getProject(workspaceId, projectId) {
    try {
        const response = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects/${projectId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": auth
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error('Error in getProject:', err.message);
        return null;
    }
}

// Proper usage
// (async () => {
//     try {
//         const timeEntry = await getCurrentTimeEntry();
//         console.log("Current Time Entry:", timeEntry);
//     } catch (err) {
//         console.error("Failed to fetch time entry:", err.message);
//     }
// })();


// const entry = await getCurrentTimeEntry();
// console.log('Fetched entry:', entry);

// const project = await getProject(entry.workspace_id, entry.project_id);

// console.log('Project:', project.name, project.color);
// console.log('Description:', entry.description);
// console.log('Start:', entry.start);
// const duration = Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000);
// const hours = Math.floor(duration / 3600);
// const minutes = Math.floor((duration % 3600) / 60);
// const seconds = duration % 60;
// console.log(`Duration: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

