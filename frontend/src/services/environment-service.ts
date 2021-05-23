import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class EnvironmentService {
  nodeEnv!: 'development' | 'production'
  debug!: boolean
  buildDate!: Date
  site!: string
}
