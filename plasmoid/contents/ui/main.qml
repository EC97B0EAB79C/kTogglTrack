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
        "time_entry_id": -1,
        "workspace_id": -1,
        "description": "No active task",
        "project_name": "",
        "color": "#000000",
        "start": -1,
        "duration": -1
    }

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

    function updateCurrentTimeEntry() {
        printDebug("Getting current time entry");
        TogglAPI.getCurrentTimeEntry(function(entry) {
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
            function(entry) {
            if (entry) {
                currentTimeEntry = entry
            } else {
                
            }
        });
    }

    Component.onCompleted: {
        updateCurrentTimeEntry();
    }

    Timer {
        interval: plasmoid.configuration.refreshPeriod * 1000
        running: true
        repeat: true
        onTriggered: updateCurrentTimeEntry()
    }

    Timer {
        interval: 500
        running: true
        repeat: true
        onTriggered: updateDuration()
    }

    compactRepresentation: RowLayout {
        id: rowLayout
        spacing: 5

        MouseArea {
            anchors.fill: parent
            onClicked: root.expanded = !root.expanded
        }

        PlasmaComponents3.Label {
            text: currentTimeEntry["description"]
            elide: Text.ElideRight
            Layout.maximumWidth: 150
            visible: currentTimeEntry["description"] !== ""
        }

        RowLayout {
            Rectangle {
                width: 10
                height: 10
                radius: 5
                color: currentTimeEntry["color"]
            }

            PlasmaComponents3.Label {
                text: currentTimeEntry["project_name"]
                color: currentTimeEntry["color"]
            }

            visible: currentTimeEntry["project_name"] !== ""
        }

        PlasmaComponents3.Label {
            text: formatDuration(currentTimeEntry["duration"])
            visible: currentTimeEntry["duration"] > 0
        }
    }
    

    fullRepresentation: ColumnLayout {
        spacing: 10
        Layout.maximumHeight: 130
        Layout.minimumHeight: 130
        Layout.maximumWidth: 300
        Layout.minimumWidth: 300

        RowLayout {
            id: rowLayout
            anchors {
                top: parent.top
                horizontalCenter: parent.horizontalCenter
                topMargin: 10
            }
            
            PlasmaComponents3.Label {
                text: currentTimeEntry["description"]
                font.bold: true
                font.pixelSize: PlasmaCore.Theme.defaultFont.pixelSize * 1.2
                visible: currentTimeEntry["description"] !== ""
            }

            Rectangle {
                width: 12
                height: 12
                radius: 6
                color: currentTimeEntry["color"]
                visible: currentTimeEntry["project_name"] !== ""
            }

            PlasmaComponents3.Label {
                text: currentTimeEntry["project_name"]
                color: currentTimeEntry["color"]
                visible: currentTimeEntry["project_name"] !== ""
            }
        }
        
        PlasmaComponents3.Label {
            id: durationLabel
            anchors {
                bottom: stopButton.top
                bottomMargin: 20
                horizontalCenter: parent.horizontalCenter
            }
            text: formatDuration(currentTimeEntry["duration"])
            font.family: "monospace"
            visible: currentTimeEntry["duration"] > 0
        }
        
        PlasmaComponents3.Button {
            id: stopButton
            anchors {
                bottom: parent.bottom
                bottomMargin: 10
                horizontalCenter: parent.horizontalCenter
            }
            text: "Stop"
            visible: currentTimeEntry["duration"] > 0
            onClicked: stopTimeEntry()
        }
    }
}
