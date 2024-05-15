import { Router, Shade, createComponent } from '@furystack/shades'
import { AppBar, AppBarLink } from '@furystack/shades-common-components'
import { SensitivitySettingsTab } from './sensitivity'
import { ControlPage } from './control'

export const SettingsPage = Shade({
  shadowDomName: 'settings-page',
  render: () => {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#bbb',
          backgroundColor: 'rgba(66, 66, 66, .5)',
          backdropFilter: 'blur(10px)',
          marginTop: '3em',
        }}>
        <AppBar style={{ height: '3em' }}>
          <AppBarLink href="/settings">🍃 Sensitivity</AppBarLink>
          <AppBarLink href="/settings/control">🛠️ Control</AppBarLink>
          <AppBarLink href="/settings/network">🛜 Network</AppBarLink>
        </AppBar>
        <Router
          routes={[
            { url: '/settings', component: () => <SensitivitySettingsTab /> },
            { url: '/settings/control', component: () => <ControlPage /> },
          ]}
        />
      </div>
    )
  },
})
