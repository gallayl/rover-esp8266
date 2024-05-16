import { Shade, attachStyles, createComponent } from '@furystack/shades'
import { EnvironmentService } from '../../services/environment-service'

export const UpdatePage = Shade({
  shadowDomName: 'flea-update-page',
  render: ({ injector, element }) => {
    attachStyles(element, {
      style: {
        position: 'fixed',
        display: 'flex',
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(66, 66, 66, .5)',
        backdropFilter: 'blur(15px)',
      },
    })
    return (
      <form
        style={{ display: 'flex', flexDirection: 'column' }}
        action={`http://${injector.getInstance(EnvironmentService).site}/update`}
        accept="application/octet-stream"
        enctype="multipart/form-data"
        {...({ method: 'POST' } as any)}>
        <div>
          <input type="file" name="update" style={{ margin: '2em' }} accept="application/octet-stream" />
          <input type="submit" value="Update" />
        </div>
      </form>
    )
  },
})
