function getCurrentTimeEntry(callback) {
    var result = {
        time_entry_id: -1,
        workspace_id: -1,
        description: "No active task",
        project_name: "",
        color: "#000000",
        start: -1,
        duration: -1
    }

    const apiKey = plasmoid.configuration.apiTokenToggl;

    if (!apiKey) {
        console.error("API key is not set");
        result.description = "API key is not set";
        callback(result);
        return;
    }

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
                        callback(result);
                        return;
                    }

                    var start = new Date(entry.start).getTime();
                    result.time_entry_id = entry.id;
                    result.workspace_id = entry.workspace_id;
                    result.description = entry.description || "";
                    result.start = start;
                    result.duration = Math.floor((Date.now() - start) / 1000);


                    if (entry.project_id) {
                        getProject(entry.workspace_id, entry.project_id, function(project) {
                            result.project_name = project?.name || "";
                            result.color = project?.color || "#000000";
                            callback(result);
                        });
                    }
                    else {
                        callback(result);
                    }
                    

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
    const apiKey = plasmoid.configuration.apiTokenToggl;

    if (!apiKey) {
        console.error("API key is not set");
        projectCallback(null);
        return;
    }

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

function stopTimeEntry(time_entry_id, workspace_id, callback){
    const apiKey = plasmoid.configuration.apiTokenToggl;
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);

    var req = new XMLHttpRequest();
    var url = `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/time_entries/${time_entry_id}/stop`;

    req.open("PATCH", url);

    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onerror = function() {
        console.error("Request couldn't be sent: " + req.statusText);
    };

    req.onreadystatechange = function() {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    getCurrentTimeEntry(callback);
                } else {
                    console.error("Stop Time Entry Error:", req.status);
                    callback(null);
                }
            } catch(e) {
                console.error("Stop Time Entry Parse Error:", e);
                callback(null);
            }
        }
    };

    req.send();
}