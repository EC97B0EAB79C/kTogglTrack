function getCurrentTimeEntry(callback) {
    const apiKey = "api_token";
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
                    var currentTimeEntry = {
                        description: entry.description,
                        project: "",
                        color: "#000000",
                        duration: Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000)
                    };
                    callback(currentTimeEntry);
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


function getProject(workspaceId, projectId, callback = function() {}) {
    const apiKey = "api_token";
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
        if (req.readyState == 4) {
            if (req.status == 200) {
                var project = JSON.parse(req.responseText);
                callback(project);
            } else {
                console.error("[getProject] Request failed: " + req.status);
            }
        }
    };

    req.send();
}