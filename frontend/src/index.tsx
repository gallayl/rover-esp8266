/// <reference types="vite/client" />

import { Injector } from '@furystack/inject'
import { VerboseConsoleLogger, getLogger, useLogging } from '@furystack/logging'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { defaultDarkTheme, useThemeCssVariables } from '@furystack/shades-common-components'
import { EnvironmentService } from './services/environment-service'
import { Layout } from './components/layout'

const shadeInjector = new Injector()

useThemeCssVariables(defaultDarkTheme)

useLogging(shadeInjector, VerboseConsoleLogger)
shadeInjector.setExplicitInstance(
  {
    nodeEnv: import.meta.env.MODE as 'development' | 'production',
    buildDate: new Date(import.meta.env.BUILD_DATE as string),
    site: import.meta.env.SITE || window.location.host,
  },
  EnvironmentService,
)

const rootElement: HTMLDivElement = document.getElementById('root') as HTMLDivElement
initializeShadeRoot({
  rootElement,
  injector: shadeInjector,
  jsxElement: <Layout />,
})

getLogger(shadeInjector)
  .withScope('Init')
  .information({ message: 'App Initialized', data: { ...shadeInjector.getInstance(EnvironmentService) } })
