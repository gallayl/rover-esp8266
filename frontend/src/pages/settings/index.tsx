import { LazyLoad, Router, Shade, createComponent } from '@furystack/shades'
import { AppBar, AppBarLink } from '@furystack/shades-common-components'
import { FullScreenLoader } from '../../components/full-screen-loader'

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
          <AppBarLink href="/settings/fpv">🎥 FPV</AppBarLink>
          <AppBarLink href="/settings/control">🛠️ Control</AppBarLink>
          <AppBarLink href="/settings/network">🛜 Network</AppBarLink>
          <AppBarLink href="/settings/update">🔃 FW upload</AppBarLink>
        </AppBar>
        <Router
          routes={[
            {
              url: '/settings',
              component: () => (
                <LazyLoad
                  loader={<FullScreenLoader />}
                  component={async () => {
                    const { SensitivitySettingsTab } = await import('./sensitivity')
                    return <SensitivitySettingsTab />
                  }}
                />
              ),
            },
            {
              url: '/settings/fpv',
              component: () => (
                <LazyLoad
                  loader={<FullScreenLoader />}
                  component={async () => {
                    const { FpvTab } = await import('./fpv')
                    return <FpvTab />
                  }}
                />
              ),
            },
            {
              url: '/settings/control',
              component: () => (
                <LazyLoad
                  loader={<FullScreenLoader />}
                  component={async () => {
                    const { ControlPage } = await import('./control')
                    return <ControlPage />
                  }}
                />
              ),
            },
            {
              url: '/settings/update',
              component: () => (
                <LazyLoad
                  component={async () => {
                    const { UpdatePage } = await import('./update-page')
                    return <UpdatePage />
                  }}
                  loader={<FullScreenLoader />}
                />
              ),
            },
          ]}
        />
      </div>
    )
  },
})
