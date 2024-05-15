import { Injectable, Injected } from '@furystack/inject'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const localStorageKey = 'FLEA_SETTINGS'

type ControlSetting = { type: 'PID'; p: number; i: number; d: number } | { type: 'direct'; throttleSensitivity: number }
type SensitivitySetting = { throttle: number; steer: number; deadZone: number; characteristic: CharacteristicSetting }
type CharacteristicSetting = 'linear' | 'exponential'
export interface ClientSettingsValues {
  control: ControlSetting
  sensitivity: SensitivitySetting
}

export const defaultSettings: ClientSettingsValues = {
  control: {
    type: 'direct',
    throttleSensitivity: 256,
  },
  sensitivity: {
    throttle: 1,
    steer: 1,
    deadZone: 0,
    characteristic: 'linear',
  },
}

@Injectable({ lifetime: 'singleton' })
export class ClientSettings {
  currentSettings = new ObservableValue<ClientSettingsValues>(defaultSettings)

  private initConfig() {
    const settings = localStorage.getItem(localStorageKey)
    try {
      const value = JSON.parse(settings || JSON.stringify(defaultSettings))
      this.currentSettings.setValue({ ...this.currentSettings.getValue(), ...value })
    } catch (error) {
      console.error('Failed to parse settings', error)
      localStorage.removeItem(localStorageKey)
    }
  }

  @Injected(NotyService)
  private declare notyService: NotyService

  constructor() {
    this.initConfig()
    this.currentSettings.subscribe((change) => {
      localStorage.setItem(localStorageKey, JSON.stringify(change))
      this.notyService.emit('onNotyAdded', { type: 'success', title: 'Success', body: 'Configuration saved' })
    })
  }
}
