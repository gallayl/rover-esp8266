import { Shade, createComponent, Router, RouteLink } from '@furystack/shades'
import { AppBar, NotyList, ThemeProviderService } from '@furystack/shades-common-components'
import { JoystickPage } from '../pages/joystick-page'
import { ConsolePage } from '../pages/console-page'
import { UpdatePage } from '../pages/update-page'
import { SettingsPage } from '../pages/settings-page'
import { StatusComponent } from './status-component'

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
        <AppBar>
          <div style={{ width: 'calc(100% - 16px)', display: 'flex' }}>
            <RouteLink href="/" style={{ marginRight: '0.5em' }}>
              Flea
            </RouteLink>
            &nbsp;
            <RouteLink href="/settings">Settings</RouteLink>&nbsp;|&nbsp;
            <RouteLink href="/console">Console</RouteLink>&nbsp;|&nbsp;
            <RouteLink href="/update">Update</RouteLink>
            <div style={{ flex: '1' }} />
          </div>
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
                component: () => <JoystickPage />,
              },
              {
                url: '/settings',
                component: () => <SettingsPage />,
              },
              {
                url: '/console',
                component: () => <ConsolePage />,
              },
              {
                url: '/update',
                component: () => <UpdatePage />,
              },
            ]}
          />
        </div>
        <NotyList />
      </div>
    )
  },
})
