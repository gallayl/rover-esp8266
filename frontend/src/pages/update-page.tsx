import { Shade, createComponent } from '@furystack/shades'
import { EnvironmentService } from '../services/environment-service'

export const UpdatePage = Shade({
  render: ({injector}) => {
    return (
      <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <form
          style={{ display: 'flex', flexDirection: 'column' }}
          action={'http://'+injector.getInstance(EnvironmentService).site + "/update"}
          accept="application/octet-stream"
          enctype="multipart/form-data"
          {...({ method: 'POST' } as any)}>
          <div>
            <input type="file" name="update" style={{ margin: '2em' }} accept="application/octet-stream" />
            <input type="submit" value="Update" />
          </div>
        </form>
      </div>
    )
  },
})
