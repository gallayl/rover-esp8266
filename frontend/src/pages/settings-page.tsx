import { createComponent, Shade } from '@furystack/shades'
import { Input, Button, ThemeProviderService } from '@furystack/shades-common-components'
import { ClientSettings, defaultSettings } from '../services/client-settings'

export const SettingsPage = Shade({
  shadowDomName: 'settings-page',
  render: ({ useObservable, injector }) => {
    const [settings, setSettings] = useObservable(
      'throttleSensitivity',
      injector.getInstance(ClientSettings).currentSettings,
    )

    const { isPidEnabled, throttleSensitivity } = settings

    const theme = injector.getInstance(ThemeProviderService)
    return (
      <div
        style={{
          marginTop: '4em',
          color: theme.theme.text.secondary,
          padding: '2em',
          backgroundColor: 'rgba(66, 66, 66, .5)',
          backdropFilter: 'blur(15px)',
        }}>
        <h1>Settings</h1>
        <Input
          labelTitle="Throttle sensitivity"
          type="range"
          value={throttleSensitivity.toString()}
          step="1"
          min="1"
          max="1024"
          onTextChange={(value) => {
            setSettings({
              ...settings,
              throttleSensitivity: parseInt(value, 10),
            })
          }}
        />
        <p>Control mode</p>
        <div style={{ display: 'flex' }}>
          <Button
            variant={isPidEnabled ? 'contained' : 'outlined'}
            onclick={() => {
              setSettings({
                ...settings,
                isPidEnabled: true,
              })
            }}>
            PID
          </Button>
          <Button
            variant={!isPidEnabled ? 'contained' : 'outlined'}
            onclick={() => {
              setSettings({
                ...settings,
                isPidEnabled: false,
              })
            }}>
            Direct
          </Button>
        </div>
        <Button
          color={'warning'}
          onclick={() => {
            setSettings(defaultSettings)
          }}>
          Reset to defaults
        </Button>
      </div>
    )
  },
})
