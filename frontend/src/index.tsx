/** ToDo: Main entry point */
import { PathHelper } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { VerboseConsoleLogger } from '@furystack/logging'
import { Layout } from './components/layout'
import '@furystack/odata-fetchr'
import './services/google-auth-provider'

const shadeInjector = new Injector()

export const environmentOptions = {
  nodeEnv: process.env.NODE_ENV as 'development' | 'production',
  debug: Boolean(process.env.DEBUG),
  appVersion: process.env.APP_VERSION as string,
  buildDate: new Date(process.env.BUILD_DATE as string),
  serviceUrl: (process.env.SERVICE_URL as string) || `${window.location.protocol}//${window.location.hostname}:9090`,
}

shadeInjector.useOdata({
  serviceEndpoint: PathHelper.joinPaths(environmentOptions.serviceUrl, 'odata'),
  defaultInit: {
    credentials: 'include',
    mode: 'no-cors',
  },
})

shadeInjector.useLogging(VerboseConsoleLogger)

shadeInjector.logger.withScope('Startup').verbose({
  message: 'Initializing Shade Frontend...',
  data: { environmentOptions },
})

const rootElement: HTMLDivElement = document.getElementById('root') as HTMLDivElement
initializeShadeRoot({
  rootElement,
  injector: shadeInjector,
  jsxElement: <Layout />,
})
