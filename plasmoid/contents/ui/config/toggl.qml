import QtQuick
import QtQuick.Layouts
import org.kde.kcmutils as KCM
import QtQuick.Controls as QQC
import org.kde.plasma.components as PlasmaComponents
import org.kde.plasma.core as PlasmaCore
import org.kde.kirigami as Kirigami

KCM.SimpleKCM {
    id: togglConfig

    property alias cfg_apiTokenToggl: apiTokenToggl.text
    property alias cfg_refreshPeriod: refreshPeriod.value
    property alias cfg_lowAPIUsage: lowAPIUsage.checked

    Kirigami.FormLayout {
        anchors.fill: parent

        Kirigami.Separator {
            Kirigami.FormData.label: i18n("API Settings")
            Kirigami.FormData.isSection: true
        }

        QQC.TextField {
            id: apiTokenToggl

            Kirigami.FormData.label: i18n("API Token:")
        }

        QQC.CheckBox {
            id: lowAPIUsage
            
            Kirigami.FormData.label: i18n("Low API usage mode:")
        }

        QQC.SpinBox {
            id: refreshPeriod

            from: 1
            to: 600
            editable: true
            enabled: !lowAPIUsage.checked

            validator: IntValidator {
                bottom: refreshPeriod.from
                top: refreshPeriod.to
            }

            Kirigami.FormData.label: i18n("Refresh period (s):")
        }
    }
}
