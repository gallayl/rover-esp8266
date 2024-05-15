import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class EnvironmentService {
  declare nodeEnv: 'development' | 'production'
  declare debug: boolean
  declare buildDate: Date
  declare site: string
}
