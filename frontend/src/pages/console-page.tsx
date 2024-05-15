import { Shade, createComponent } from '@furystack/shades'
import { Button, Form } from '@furystack/shades-common-components'
import { WebSocketEvent, WebSocketService } from '../services/websocket-service'

export const ConsoleEntryList = Shade<{ events: WebSocketEvent[] }>({
  shadowDomName: 'flea-console-entries',
  render: ({ props }) => {
    return (
      <div>
        {props.events.map((event) => (
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
            {event.dataObject ? (
              <code style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(event.dataObject, undefined, 2)}</code>
            ) : (
              <div> {event.data} </div>
            )}
          </div>
        ))}
      </div>
    )
  },
})

export const ConsolePage = Shade({
  shadowDomName: 'flea-console-page',
  render: ({ injector }) => {
    const webSocketService = injector.getInstance(WebSocketService)
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
        }}>
        <div style={{ flexGrow: '1', overflow: 'auto', height: '100px', padding: '1em' }}>
          <ConsoleEntryList events={webSocketService.eventStream} />
        </div>
        <Form<{ command: string }>
          onSubmit={({ command }) => {
            webSocketService.send(command)
          }}
          validate={(data): data is { command: string } => {
            return (data as any).command?.length
          }}>
          <input
            autofocus
            style={{ display: 'block', flexGrow: '1', width: '100%' }}
            placeholder="Command"
            name="command"
          />
          <Button title="Send" type="submit">
            Send
          </Button>
        </Form>
      </div>
    )
  },
})
