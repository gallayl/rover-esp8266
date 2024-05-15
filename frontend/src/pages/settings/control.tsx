import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, Paper } from '@furystack/shades-common-components'
import {
  ClientSettings,
  ClientSettingsValues,
  defaultPidSettings,
  defaultSettings,
} from '../../services/client-settings'

export const ControlPage = Shade({
  shadowDomName: 'control-tab',
  render: ({ injector, useObservable, useState }) => {
    const [settings, setSettings] = useObservable('settings', injector.getInstance(ClientSettings).currentSettings)

    const [type, setType] = useState('type', settings.control.type)

    return (
      <Paper style={{ paddingTop: '4em', margin: '0' }}>
        <label>
          <input
            type="radio"
            checked={type === 'PID'}
            name="type"
            value="PID"
            onclick={() => {
              setType('PID')
            }}
          />
          PID
        </label>
        <label>
          <input
            type="radio"
            checked={type === 'direct'}
            name="type"
            value="direct"
            onclick={() => setType('direct')}
          />
          Direct
        </label>
        {type === 'PID' ? (
          <Form<ClientSettingsValues['control']>
            validate={(_formData): _formData is ClientSettingsValues['control'] => true}
            onSubmit={(control) => {
              setSettings({ ...settings, control })
            }}>
            <Input
              type="number"
              name="p"
              labelTitle="P"
              value={settings.control.type === 'PID' ? settings.control.p.toString() : defaultPidSettings.p.toString()}
            />
            <Input
              type="number"
              name="i"
              labelTitle="I"
              value={settings.control.type === 'PID' ? settings.control.i.toString() : defaultPidSettings.i.toString()}
            />
            <Input
              type="number"
              name="d"
              labelTitle="D"
              value={settings.control.type === 'PID' ? settings.control.d.toString() : defaultPidSettings.d.toString()}
            />
            <input type="hidden" name="type" value="PID" />
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </Form>
        ) : (
          <Form<ClientSettingsValues['control']>
            validate={(_formData): _formData is ClientSettingsValues['control'] => true}
            onSubmit={(control) => {
              setSettings({
                ...settings,
                control: {
                  type: 'direct',
                  throttleSensitivity: parseInt((control as any).throttleSensitivity),
                },
              })
            }}>
            <Input
              type="number"
              name="throttleSensitivity"
              labelTitle="Throttle Sensitivity"
              value={
                settings.control.type === 'direct'
                  ? settings.control.throttleSensitivity.toString()
                  : defaultSettings.control.throttleSensitivity.toString()
              }
            />
            <input type="hidden" name="type" value="direct" />
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </Form>
        )}
      </Paper>
    )
  },
})
