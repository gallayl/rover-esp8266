import { createComponent, Shade, Router } from '@furystack/shades'
import { Init, FirstPersonView, Offline } from '../pages'

export const Body = Shade({
  shadowDomName: 'shade-app-body',
  initialState: {
    isOnline: true,
  },
  render: ({ getState }) => {
    return (
      <div
        id="Body"
        style={{
          margin: '10px',
          padding: '10px',
          position: 'fixed',
          top: '40px',
          width: 'calc(100% - 40px)',
          height: 'calc(100% - 80px)',
          overflow: 'hidden',
        }}>
        {(() => {
          switch (getState().isOnline) {
            case true:
              return (
                <Router
                  routeMatcher={(current, component) => current.pathname === component}
                  notFound={() => <div>Route not found</div>}
                  routes={[{ url: '/', component: () => <FirstPersonView /> }]}></Router>
              )
            case false:
              return <Offline />
            default:
              return <Init />
          }
        })()}
      </div>
    )
  },
})
