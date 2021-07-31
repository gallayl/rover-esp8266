import { createComponent, Shade } from '@furystack/shades'
import { Input, Button, ThemeProviderService } from '@furystack/shades-common-components'
import { ClientSettings, ClientSettingsValues, defaultSettings } from '../services/client-settings'

export const SettingsPage = Shade<unknown, ClientSettingsValues>({
  getInitialState: ({ injector }) => injector.getInstance(ClientSettings).currentSettings.getValue(),
  constructed: ({ injector, updateState }) => {
    const subscription = injector
      .getInstance(ClientSettings)
      .currentSettings.subscribe((settings) => updateState(settings))
    return () => subscription.dispose()
  },
  render: ({ getState, injector }) => {
    const { throttleSensitivity, isPidEnabled } = getState()
    const theme = injector.getInstance(ThemeProviderService)
    const settingsService = injector.getInstance(ClientSettings)
    return (
      <div
        style={{
          marginTop: '4em',
          color: theme.theme.getValue().text.secondary,
          padding: '2em',
          backgroundColor: 'rgba(66, 66, 66, .5)',
          backdropFilter: 'blur(15px)',
        }}>
        <h1>Settings</h1>
        <Input
          labelTitle="Throttle sensitivity"
          type="number"
          value={throttleSensitivity.toString()}
          min="1"
          max="1024"
          onTextChange={(value) => {
            settingsService.currentSettings.setValue({
              ...settingsService.currentSettings.getValue(),
              throttleSensitivity: parseInt(value, 10),
            })
          }}
        />
        <div>
          Control mode
          <Button
            variant={isPidEnabled ? 'contained' : 'outlined'}
            onclick={() => {
              settingsService.currentSettings.setValue({
                ...settingsService.currentSettings.getValue(),
                isPidEnabled: true,
              })
            }}>
            PID
          </Button>
          <Button
            variant={!isPidEnabled ? 'contained' : 'outlined'}
            onclick={() => {
              settingsService.currentSettings.setValue({
                ...settingsService.currentSettings.getValue(),
                isPidEnabled: false,
              })
            }}>
            Direct
          </Button>
        </div>
        <Button
          color={'warning'}
          onclick={() => {
            settingsService.currentSettings.setValue(defaultSettings)
          }}>
          Reset to defaults
        </Button>
      </div>
    )
  },
})
