import { Shade, createComponent, Router, LazyLoad } from '@furystack/shades'
import { AppBar, AppBarLink, NotyList, ThemeProviderService } from '@furystack/shades-common-components'
import { StatusComponent } from './status-component'
import { FullScreenLoader } from './full-screen-loader'
import { ConnectionStatus } from './connection-status'
import { DistanceComponent } from './distance-component'

export const Layout = Shade({
  shadowDomName: 'flea-layout',
  render: ({ injector }) => {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '18px',
        }}>
        <AppBar
          style={{
            height: '2em',
            padding: '0.5em 0',
            display: 'flex',
          }}>
          <AppBarLink href="/" style={{ marginRight: '0.5em' }}>
            🪲 Flea
          </AppBarLink>

          <AppBarLink href="/settings" routingOptions={{ end: false }}>
            ⚙️ Settings
          </AppBarLink>
          <AppBarLink href="/console">⌨️ Console</AppBarLink>

          <div style={{ flex: '1' }} />
          <DistanceComponent
            style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 1em', marginRight: '1em' }}
          />
          <ConnectionStatus />
        </AppBar>
        <div
          style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '-1',
            backgroundColor: injector.getInstance(ThemeProviderService).theme.background.default,
          }}>
          <StatusComponent style={{ width: 'calc(100% - 15em)', height: 'calc(100% - 15em)' }} />
        </div>
        <div style={{ width: '100%', height: '100%', flexGrow: '1' }}>
          <Router
            routes={[
              {
                url: '/',
                component: () => (
                  <LazyLoad
                    component={async () => {
                      const { JoystickPage } = await import('../pages/joystick-page')
                      return <JoystickPage />
                    }}
                    loader={<FullScreenLoader />}
                  />
                ),
              },
              {
                routingOptions: {
                  end: false,
                },
                url: '/settings',
                component: () => (
                  <LazyLoad
                    component={async () => {
                      const { SettingsPage } = await import('../pages/settings')
                      return <SettingsPage />
                    }}
                    loader={<FullScreenLoader />}
                  />
                ),
              },
              {
                url: '/console',
                component: () => (
                  <LazyLoad
                    component={async () => {
                      const { ConsolePage } = await import('../pages/console-page')
                      return <ConsolePage />
                    }}
                    loader={<FullScreenLoader />}
                  />
                ),
              },
            ]}
          />
        </div>
        <NotyList />
      </div>
    )
  },
})
