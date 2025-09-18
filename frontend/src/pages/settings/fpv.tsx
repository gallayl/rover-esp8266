import { createComponent, Shade } from "@furystack/shades"
import { Button, Form, Input, Paper } from "@furystack/shades-common-components"
import { ClientSettings, FpvSettings } from "../../services/client-settings"
import { CameraSettingsService } from "../../services/camera-settings-service"
import { hasCacheValue } from "@furystack/cache"

type FormData = FpvSettings & { quality: string, resolution: string }


export const FpvTab = Shade({
    shadowDomName: 'fpv-settings-tab',
    render: ({ useObservable, injector }) => {
        const [settings, setSettings] = useObservable('settings', injector.getInstance(ClientSettings).currentSettings)

        const cameraSettingsService = injector.getInstance(CameraSettingsService)

        const [cameraSettings] = useObservable('cameraSettings', cameraSettingsService.getCameraSettingsAsObservable())

        if (cameraSettings.status === 'loading') {
            return <div>Loading camera settings...</div>
        }

        return (<Form<FormData> onSubmit={(newSettings) => {
            setSettings({ ...settings, fpv: newSettings })
            cameraSettingsService.updateCameraSettings({
                quality: parseInt(newSettings.quality),
                framesize: parseInt(newSettings.resolution)
            })
        }} validate={(_formData): _formData is FormData => true}>
            <Paper style={{ padding: '1em', paddingTop: '3em', overflowY: 'auto' }}>

                <h2>FPV Settings</h2>
                <p>Configure your First Person View (FPV) settings here.</p>

                <div style={{ marginTop: '1em' }}>
                    <label>
                        FPV Host URL:
                        <Input type="text" name="host" placeholder="http://your-fpv-host" value={settings.fpv.host} onTextChange={(newText) => setSettings({
                            ...settings,
                            fpv: { ...settings.fpv, host: newText }
                        })} />
                    </label>
                </div>

                <div style={{ marginTop: '1em' }}>
                    <label>
                        Video Resolution:
                        <input type="range" min="1" max="12" defaultValue={hasCacheValue(cameraSettings) ? cameraSettings.value.framesize.toFixed() : '8'} style={{ marginLeft: '1em' }} name="resolution" />
                    </label>
                </div>
                <div style={{ marginTop: '1em' }}>
                    <label>
                        Compression quality:
                        <input type="range" min="1" max="100" defaultValue={hasCacheValue(cameraSettings) ? cameraSettings.value.quality.toFixed() : '8'} style={{ marginLeft: '1em' }} name="quality" />
                    </label>
                </div>
                <Button type="submit" style={{ marginTop: '2em' }} variant="contained" color="primary">Save FPV Settings</Button>

            </Paper>
        </Form>)
    }
})