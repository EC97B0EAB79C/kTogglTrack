import QtQml
import QtQuick
import QtQuick.Layouts
import org.kde.plasma.plasmoid
import org.kde.kirigami as Kirigami
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.components 3.0 as PlasmaComponents3
import "../code/toggl-api.js" as TogglAPI

PlasmoidItem {
    id: root

    property var currentTimeEntry: {
        "workspace_id": null,
        "time_entry_id": null,
        "description": "No active task",
        "duration": -1,
        "project_id": null,
        "project_name": "",
        "project_color": "#000000",
        "start": -1,
        "tag_ids": []
    }
    property bool apiKeyValid: false

    property int triggerCount: 0

    // ---- Helpers -----------------------------------------------------------
    function printDebug(msg) {
        if (plasmoid.configuration.logConsole) {
            console.log("[debug] [main.qml] " + msg);
        }
    }

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // ---- Toggl API Calls ---------------------------------------------------
    function validateApiKey() {
        if (plasmoid.configuration.apiTokenToggl === null || plasmoid.configuration.apiTokenToggl === "") {
            apiKeyValid = false;
            return;
        }

        TogglAPI.validateApiKey(function(isValid) {
            apiKeyValid = isValid;
        });
    }

    function updateCurrentTimeEntry() {
        printDebug("Getting current time entry");
        TogglAPI.getRecentTimeEntry(function(entry) {
            if (entry) {
                currentTimeEntry = entry
            } else {
                
            }
        });
    }

    function updateDuration() {
        printDebug("Updating duration");
        if (currentTimeEntry["start"] > 0) {
            currentTimeEntry["duration"] = Math.floor((new Date() - currentTimeEntry["start"]) / 1000);
        } else {
            currentTimeEntry["duration"] = -1;
        }
        currentTimeEntry = currentTimeEntry;
    }

    function stopTimeEntry() {
        printDebug("Stopping time entry");
        TogglAPI.stopTimeEntry(
            currentTimeEntry["time_entry_id"],
            currentTimeEntry["workspace_id"],
            function(entry) { if(entry) { currentTimeEntry = entry } }
        );
    }

    function postTimeEntry() {
        printDebug("Posting time entry");
        TogglAPI.postTimeEntry(
            currentTimeEntry,
            function(entry) { if(entry) { currentTimeEntry = entry } }
        );
    }

    // ---- Timer -------------------------------------------------------------
    Timer {
        interval: 250
        running: true
        repeat: true
        onTriggered: {
            if (!plasmoid.configuration.lowAPIUsage && (triggerCount % (plasmoid.configuration.refreshPeriod * 4)) === 0) {
                updateCurrentTimeEntry();
                triggerCount = 0;
            }
            else {
                updateDuration();
            }

            triggerCount++;
        }
    }

    // ---- Configuration Changes -----------------------------------
    Connections {
        target: plasmoid.configuration
        
        function onApiTokenTogglChanged() {
            validateApiKey();
            if (apiKeyValid) {
                updateCurrentTimeEntry();
            }
        }
    }

    Component.onCompleted: {
        validateApiKey(); 
    }

    // ---- Layouts -----------------------------------------------------------
    // Compact Representation
    compactRepresentation: RowLayout {
        id: rowLayout
        spacing: 5

        MouseArea {
            anchors.fill: parent
            onClicked: {
                root.expanded = !root.expanded
                updateCurrentTimeEntry()
            }
        }

        PlasmaComponents3.Label {
            text: {
                if (plasmoid.configuration.apiTokenToggl === null || plasmoid.configuration.apiTokenToggl === "") {
                    "API Token is not set"
                } else if (!apiKeyValid) {
                    "API Token is invalid"
                } else if (currentTimeEntry["time_entry_id"] !== null) {
                    currentTimeEntry["description"]
                } else {
                    "No Active Task"
                }
            }
            
            elide: Text.ElideRight
            Layout.maximumWidth: 150
            visible: (currentTimeEntry["time_entry_id"] === null) | (currentTimeEntry["description"] !== "")
        }

        RowLayout {
            Rectangle {
                width: 10
                height: 10
                radius: 5
                color: currentTimeEntry["project_color"]
            }

            PlasmaComponents3.Label {
                text: currentTimeEntry["project_name"]
                color: currentTimeEntry["project_color"]
            }

            visible: (currentTimeEntry["time_entry_id"] !== null) && (!plasmoid.configuration.lowAPIUsage)
        }

        PlasmaComponents3.Label {
            text: formatDuration(currentTimeEntry["duration"])
            visible: (currentTimeEntry["time_entry_id"] !== null) && (!plasmoid.configuration.lowAPIUsage)
        }
    }
    
    // Full Representation
    fullRepresentation: ColumnLayout {
        spacing: 10
        Layout.maximumHeight: 130
        Layout.minimumHeight: 130
        Layout.maximumWidth: 300
        Layout.minimumWidth: 300

        Component.onCompleted: {
            updateCurrentTimeEntry();
        }

        // Task Details
        RowLayout {
            id: rowLayout
            anchors {
                top: parent.top
                horizontalCenter: parent.horizontalCenter
                topMargin: 10
            }
            
            PlasmaComponents3.Label {
                text: {
                    if (plasmoid.configuration.apiTokenToggl === null || plasmoid.configuration.apiTokenToggl === "") {
                        "API Token is not set"
                    } else if (!apiKeyValid) {
                        "API Token is invalid"
                    } else{
                        currentTimeEntry["description"]
                    }
                }
                font.bold: true
                font.pixelSize: PlasmaCore.Theme.defaultFont.pixelSize * 1.2
                visible: currentTimeEntry["description"] !== ""
            }

            Rectangle {
                width: 12
                height: 12
                radius: 6
                color: currentTimeEntry["project_color"]
                visible: currentTimeEntry["project_id"] !== null
            }

            PlasmaComponents3.Label {
                text: currentTimeEntry["project_name"]
                color: currentTimeEntry["project_color"]
                visible: currentTimeEntry["project_id"] !== null
            }
        }
        
        // If task active: show duration
        // If task inactive: show continue text
        PlasmaComponents3.Label {
            id: durationLabel
            anchors {
                bottom: stopButton.top
                bottomMargin: 20
                horizontalCenter: parent.horizontalCenter
            }
            text: {
                if (currentTimeEntry["time_entry_id"] !== null){
                    formatDuration(currentTimeEntry["duration"])
                } else {
                    "Continue task?"
                }
            }
            font.family: "monospace"
            visible: currentTimeEntry["workspace_id"] !== null
        }
        
        // If task active: show duration
        // If task inactive: show continue text
        PlasmaComponents3.Button {
            id: stopButton
            anchors {
                bottom: parent.bottom
                bottomMargin: 10
                horizontalCenter: parent.horizontalCenter
            }
            text: {
                if (currentTimeEntry["time_entry_id"] !== null){
                    "Stop"
                } else {
                    "Continue"
                }
            }
            onClicked: {
                if (currentTimeEntry["time_entry_id"] !== null){
                    stopTimeEntry()
                } else {
                    postTimeEntry()
                }
            }
            visible: currentTimeEntry["workspace_id"] !== null
        }

    }
}
