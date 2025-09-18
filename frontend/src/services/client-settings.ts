import { Injectable, Injected } from '@furystack/inject'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const localStorageKey = 'FLEA_SETTINGS'

export type PidControlSetting = { type: 'PID'; p: number; i: number; d: number }

export type DirectControlSetting = { type: 'direct'; throttleSensitivity: number }

export type FpvSettings = {
  host: string
}

export type ControlSetting = PidControlSetting | DirectControlSetting
export type SensitivitySetting = {
  throttle: number
  steer: number
  deadZone: number
  characteristic: CharacteristicSetting
}
export type CharacteristicSetting = 'linear' | 'exponential'
export interface ClientSettingsValues {
  fpv: FpvSettings
  control: ControlSetting
  sensitivity: SensitivitySetting
}

export const defaultSettings = {
  fpv: {
    host: 'http://192.168.0.68',
  },
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
} satisfies ClientSettingsValues

export const defaultPidSettings = {
  type: 'PID',
  p: 50,
  i: 0.2,
  d: 1,
} satisfies ControlSetting

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
