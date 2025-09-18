import { Cache } from "@furystack/cache";
import { Injectable, Injected } from "@furystack/inject";
import { ClientSettings } from "./client-settings";


@Injectable({ lifetime: 'singleton' })
export class FlashlightSettingsService {

    @Injected(ClientSettings)
    declare private clientSettings: ClientSettings;

    private cache = new Cache<number, []>({
        load: async () => {
            const { fpv } = this.clientSettings.currentSettings.getValue()
            const response = await fetch(fpv.host + '/lights', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            if (response.ok) {
                const data = await response.json() as { front: number }
                return data.front
            }
            throw new Error('Failed to fetch flashlight state')
        }
    })

    public getFlashlightState = async () => {
        return this.cache.get()
    }

    public getFlashlightStateAsObservable = () => {
        return this.cache.getObservable()
    }

    public setFlashlightState = async (intensity: number) => {
        const { fpv } = this.clientSettings.currentSettings.getValue()
        const response = await fetch(fpv.host + '/lights', {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ front: intensity }),
            headers: {
                'Content-Type': 'application/json',
            }
        })
        if (response.ok) {
            const data = await response.json() as { front: number }
            this.cache.setExplicitValue({ loadArgs: [], value: { status: 'loaded', value: data.front, updatedAt: new Date() } })
            return data.front
        }
        throw new Error('Failed to set flashlight state')

    }
}