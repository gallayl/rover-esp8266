import { Shade, createComponent } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components/dist/components/button'
import { WebSocketEvent, WebSocketService } from '../services/websocket-service'

export const ConsoleEntryList = Shade<unknown, { webSocketService: WebSocketService; entries: WebSocketEvent<any>[] }>({
  shadowDomName: 'flea-console-entries',
  getInitialState: ({ injector }) => ({
    webSocketService: injector.getInstance(WebSocketService),
    entries: injector.getInstance(WebSocketService).eventStream,
  }),
  constructed: ({ getState, updateState, element }) => {
    const updateEvents = getState().webSocketService.lastMessage.subscribe(() => {
      updateState({ entries: getState().webSocketService.eventStream })
      element.parentElement?.scrollTo({ top: element.firstElementChild?.scrollHeight || Number.MAX_SAFE_INTEGER })
    })
    element.parentElement?.scrollTo({ top: element.firstElementChild?.scrollHeight || Number.MAX_SAFE_INTEGER })
    return () => {
      updateEvents.dispose()
    }
  },
  render: ({ getState }) => {
    return (
      <div >
        {getState().entries.map((event) => (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontFamily: 'monospace' }}>
            <div
              style={{
                fontSize: '20px',
                width: '40px',
                height: '40px',
                textAlign: 'center',
                verticalAlign: 'middle',
                lineHeight: '40px',
                flexShrink: '0',
                marginRight: '1em',
                color: event.type === 'incoming' ? '#aa2233' : '#22bb33',
              }}>
              {event.type === 'incoming' ? '<' : event.type === 'outgoing' ? '>' : '|'}{' '}
            </div>{' '}
            {event.dataObject ? <code style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(event.dataObject, undefined, 2)}</code> : <div> {event.data} </div>}

          </div>
        ))}
      </div>
    )
  },
})

export const ConsolePage = Shade<
  unknown,
  { webSocketService: WebSocketService; command: string; }
>({
  getInitialState: ({ injector }) => ({
    webSocketService: injector.getInstance(WebSocketService),
    command: '',
  }),
  shadowDomName: 'flea-console-page',
  render: ({ getState, updateState }) => {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#bbb',
        }}>
        <div style={{ flexGrow: '1', overflow: 'auto', height: '100px', padding: '1em' }}>
          <ConsoleEntryList />
        </div>
        <form
          style={{ display: 'flex', flexDirection: 'row', width: '100%', flexShrink: '0' }}
          onsubmit={(ev) => {
            ev.preventDefault()
            getState().webSocketService.send(getState().command)
            updateState({ command: '' }, true)
              ; (ev.target as HTMLFormElement).reset()
          }}>
          <input
            autofocus
            style={{ display: 'block', flexGrow: '1', width: '100%' }}
            placeholder="Command"
            onkeyup={(ev) => updateState({ command: (ev.target as HTMLInputElement)?.value }, true)}
          />
          <Button title="Send" type="submit">
            Send
          </Button>
        </form>
      </div>
    )
  },
})
