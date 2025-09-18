import { createComponent, Shade } from "@furystack/shades";
import { Button } from "@furystack/shades-common-components";
import { ClientSettings } from "../services/client-settings";
import { FlashlightSettingsService } from "../services/flashlight-settings-service";

export const FlashlightButton = Shade({
    shadowDomName: "flashlight-button",
    render: ({ injector, useObservable }) => {

        const flash = injector.getInstance(FlashlightSettingsService)
        const [currentSettings] = useObservable('fpvSettings', injector.getInstance(ClientSettings).currentSettings)


        const [state] = useObservable('flashlight', flash.getFlashlightStateAsObservable())


        if (!currentSettings?.fpv?.host) {
            return null
        }

        const isOn = state?.value;

        if (!isOn) {
            return <Button onclick={() => {
                flash.setFlashlightState(64)
            }}>
                🔦 On
            </Button>
        }

        return <div style={{ whiteSpace: 'nowrap' }}>
            <Button onclick={() => {
                flash.setFlashlightState(255)
            }}>
                🔦 Max
            </Button>
            <Button onclick={() => {
                flash.setFlashlightState(0)
            }}>
                🔦 Off
            </Button>

        </div>

    }
})