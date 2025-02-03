function getCurrentTimeEntry(callback) {
    const apiKey = "api_key";
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);
    
    var req = new XMLHttpRequest();
    var url = "https://api.track.toggl.com/api/v9/me/time_entries/current";

    req.open("GET", url, true);
    
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onreadystatechange = function() {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    var entry = JSON.parse(req.responseText);

                    if (!entry || !entry.start) {
                        callback(null);
                        return;
                    }

                    var start = new Date(entry.start).getTime();

                    getProject(entry.workspace_id, entry.project_id, function(project) {
                        const currentTimeEntry = {
                            description: entry.description || "No description",
                            project_name: project?.name || "No project",
                            color: project?.color || "#000000",
                            start: start,
                            duration: Math.floor((Date.now() - start) / 1000)
                        };
                        callback(currentTimeEntry);
                    });

                } else {
                    console.error("[HTTP Error]", req.status, req.statusText);
                    callback(null);
                }
            } catch(e) {
                console.error("[Parsing Error]", e.message);
                callback(null);
            }
        }
    };

    req.onerror = function() {
        console.error("[Network Error] Request failed");
        callback(null);
    };

    req.send();
}


function getProject(workspaceId, projectId, projectCallback) {
    const apiKey = "api_key";
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);
    
    var req = new XMLHttpRequest();
    var url = `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects/${projectId}`;

    req.open("GET", url);
    
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onerror = function() {
        console.error("Request couldn't be sent: " + req.statusText);
    };

    req.onreadystatechange = function() {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    const project = JSON.parse(req.responseText);
                    projectCallback({
                        name: project.name,
                        color: project.color
                    });
                } else {
                    console.error("Project Fetch Error:", req.status);
                    projectCallback(null);
                }
            } catch(e) {
                console.error("Project Parse Error:", e);
                projectCallback(null);
            }
        }
    };


    req.send();
}