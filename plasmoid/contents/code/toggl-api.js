function validateApiKey(callback) {
    var result = false;

    const apiKey = plasmoid.configuration.apiTokenToggl;
    if (!apiKey) {
        console.error("API key is not set");
        callback(result);
        return;
    }
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);

    var req = new XMLHttpRequest();
    var url = "https://api.track.toggl.com/api/v9/me";

    req.open("GET", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onreadystatechange = function () {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    result = true;
                } else {
                    console.error("[HTTP Error]", req.status, req.statusText);
                }
            } catch (e) {
                console.error("[Parsing Error]", e.message);
            }
            callback(result);
        }
    };

    req.onerror = function () {
        console.error("[Network Error] Request failed");
        callback(result);
    };

    req.send();
}


function getRecentTimeEntry(callback) {
    var result = {
        workspace_id: null,
        time_entry_id: null,
        description: "",
        duration: -1,
        project_id: null,
        project_name: "",
        project_color: "#000000",
        start: -1,
        tag_ids: []
    }

    const apiKey = plasmoid.configuration.apiTokenToggl;
    if (!apiKey) {
        console.error("API key is not set");
        result.description = null;
        callback(result);
        return;
    }
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);

    var req = new XMLHttpRequest();
    var url = "https://api.track.toggl.com/api/v9/me/time_entries";

    req.open("GET", url, true);

    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onreadystatechange = function () {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    var entries = JSON.parse(req.responseText);
                    if (entries.length == 0) {
                        callback(result);
                        return;
                    }

                    var recent = entries[0];
                    result.workspace_id = recent.workspace_id;
                    result.description = recent.description || "";
                    result.duration = recent.duration;
                    result.project_id = recent.project_id;
                    result.tag_ids = recent.tag_ids || [];

                    if (recent.duration < 0) {
                        result.time_entry_id = recent.id;
                        result.start = new Date(recent.start).getTime();
                        result.duration = Math.floor((Date.now() - result.start) / 1000);
                    }

                    if (recent.project_id) {
                        getProject(recent.workspace_id, recent.project_id, function (project) {
                            result.project_name = project?.name || "";
                            result.project_color = project?.color || "#000000";
                            callback(result);
                        });
                    } else {
                        callback(result);
                    }

                } else {
                    console.error("[HTTP Error]", req.status, req.statusText);
                    callback(null);
                }
            } catch (e) {
                console.error("[Parsing Error]", e.message);
                callback(null);
            }
        }
    };

    req.onerror = function () {
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

    req.onerror = function () {
        console.error("Request couldn't be sent: " + req.statusText);
    };

    req.onreadystatechange = function () {
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
            } catch (e) {
                console.error("Project Parse Error:", e);
                projectCallback(null);
            }
        }
    };

    req.send();
}


function stopTimeEntry(time_entry_id, workspace_id, callback) {
    const apiKey = plasmoid.configuration.apiTokenToggl;
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);

    var req = new XMLHttpRequest();
    var url = `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/time_entries/${time_entry_id}/stop`;

    req.open("PATCH", url);

    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onerror = function () {
        console.error("Request couldn't be sent: " + req.statusText);
    };

    req.onreadystatechange = function () {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    getCurrentTimeEntry(callback);
                } else {
                    console.error("Stop Time Entry Error:", req.status);
                    callback(null);
                }
            } catch (e) {
                console.error("Stop Time Entry Parse Error:", e);
                callback(null);
            }
        }
    };

    req.send();
}


function postTimeEntry(recent_time_entry, callback) {
    const apiKey = plasmoid.configuration.apiTokenToggl;
    const auth = "Basic " + Qt.btoa(`${apiKey}:api_token`);

    var req = new XMLHttpRequest();
    var url = `https://api.track.toggl.com/api/v9/workspaces/${recent_time_entry.workspace_id}/time_entries`;

    req.open("POST", url);

    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", auth);

    req.onerror = function () {
        console.error("Request couldn't be sent: " + req.statusText);
    };

    req.onreadystatechange = function () {
        if (req.readyState === XMLHttpRequest.DONE) {
            try {
                if (req.status === 200) {
                    getCurrentTimeEntry(callback);
                } else {
                    console.error("Post Time Entry Error:", req.status);
                    callback(null);
                }
            } catch (e) {
                console.error("Post Time Entry Parse Error:", e);
                callback(null);
            }
        }
    };

    req.send(JSON.stringify({
        created_with: "kTogglTrack",
        description: recent_time_entry.description,
        duration: -1,
        project_id: recent_time_entry.project_id,
        start: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
        workspace_id: recent_time_entry.workspace_id,
        tag_ids: recent_time_entry.tag_ids
    }));
}