import { Injectable, Injector } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils/dist/observable-value'
import { ScopedLogger } from '@furystack/logging'

const localStorageKey = 'FLEA_SETTINGS'

interface ClientSettingsValues {
  isPidEnabled: boolean
  throttleSensitivity: number
  steerSensitivity: number
}

@Injectable({ lifetime: 'singleton' })
export class ClientSettings {
  currentSettings = new ObservableValue<ClientSettingsValues>({
    isPidEnabled: true,
    throttleSensitivity: 32,
    steerSensitivity: 32,
  })

  logger: ScopedLogger

  private initConfig() {
    const settings = localStorage.getItem(localStorageKey)
    try {
      const value = JSON.parse(settings || '')
      this.currentSettings.setValue({ ...this.currentSettings.getValue(), ...value })
    } catch (error) {
      this.logger.warning({ message: 'Failed to parse stored settings. Resetting to defaults...' })
      localStorage.removeItem(localStorageKey)
    }
  }

  constructor(injector: Injector) {
    this.logger = injector.logger.withScope('ClientSettings')
    this.initConfig()
  }
}
