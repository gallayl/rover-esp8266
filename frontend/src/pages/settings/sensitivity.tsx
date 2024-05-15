import { Shade, createComponent } from '@furystack/shades'
import { ClientSettings, ClientSettingsValues } from '../../services/client-settings'
import { Button, Form, Input, Paper } from '@furystack/shades-common-components'

export const SensitivitySettingsTab = Shade({
  shadowDomName: 'movement-settings-tab',
  render: ({ injector, useObservable }) => {
    const [settings, setSettings] = useObservable('settings', injector.getInstance(ClientSettings).currentSettings)
    const {} = settings

    return (
      <Paper style={{ paddingTop: '3em', margin: '0' }}>
        <Form<ClientSettingsValues['sensitivity']>
          onSubmit={(sensitivity) => {
            setSettings({ ...settings, sensitivity })
          }}
          validate={(_formData): _formData is ClientSettingsValues['sensitivity'] => true}>
          <Input
            min={'0'}
            max="5"
            step="0.1"
            value={settings.sensitivity.throttle.toString()}
            type="range"
            name="throttle"
            getHelperText={({ state }) => `Throttle: ${parseInt(state.value) * 100}%`}
          />
          <Input
            min={'0'}
            max="5"
            step="0.1"
            value={settings.sensitivity.steer.toString()}
            type="range"
            name="steer"
            getHelperText={({ state }) => `Steering: ${parseInt(state.value) * 100}%`}
          />
          <Input
            min={'0'}
            max="1"
            step="0.002"
            value={settings.sensitivity.deadZone.toString()}
            type="range"
            name="deadZone"
            getHelperText={({ state }) => `Dead zone: ${(parseFloat(state.value) * 100).toFixed(2)}%`}
          />
          <div>
            <label>
              <input
                type="radio"
                name="characteristic"
                value="linear"
                checked={settings.sensitivity.characteristic === 'linear'}
              />
              Linear
            </label>
            <label>
              <input
                type="radio"
                name="characteristic"
                value="exponential"
                checked={settings.sensitivity.characteristic === 'exponential'}
              />
              Exponential
            </label>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: '1' }}></div>
            <Button color="primary" variant="contained" type="submit">
              Save
            </Button>
          </div>
        </Form>
      </Paper>
    )
  },
})
