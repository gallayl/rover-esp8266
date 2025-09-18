import { Cache } from "@furystack/cache";
import { Injectable, Injected } from "@furystack/inject";
import { ClientSettings } from "./client-settings";

type CameraSettings = {
    "framesize": number,
    "quality": number,
    "brightness": number,
    "contrast": number,
    "saturation": number,
    "gainceiling": number,
    "colorbar": number,
    "awb": number,
    "agc": number,
    "aec": number,
    "hmirror": number,
    "vflip": number,
    "awb_gain": number,
    "agc_gain": number,
    "aec_value": number,
    "aec2": number,
    "dcw": number,
    "bpc": number,
    "wpc": number,
    "raw_gma": number,
    "lenc": number,
    "special_effect": number,
    "wb_mode": number,
    "ae_level": number
}


@Injectable({ lifetime: 'singleton' })
export class CameraSettingsService {

    @Injected(ClientSettings)
    declare private clientSettings: ClientSettings;

    private getSettingsFromFpvUrl = async () => {
        const { fpv } = this.clientSettings.currentSettings.getValue()
        const response = await fetch(fpv.host + '/cam-settings', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        if (response.ok) {
            const data = await response.json() as CameraSettings
            return data
        } else {
            throw new Error('Failed to fetch FPV settings')
        }
    }


    private updateSettingsToFpvUrl = async (newSettings: Partial<CameraSettings>) => {
        const { fpv } = this.clientSettings.currentSettings.getValue()

        const setSettings = await fetch(fpv.host + '/cam-settings', {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(newSettings),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (setSettings.ok) {
            const data = await setSettings.json() as CameraSettings
            return data
        } else {
            throw new Error('Failed to update FPV settings')
        }
    }

    private cameraSettingsCache = new Cache<CameraSettings, []>({
        load: () => this.getSettingsFromFpvUrl(),
    })

    public getCameraSettings = async () => {
        return this.cameraSettingsCache.get()
    }

    public getCameraSettingsAsObservable = () => {
        return this.cameraSettingsCache.getObservable()
    }

    public updateCameraSettings = async (newSettings: Partial<CameraSettings>) => {
        try {
            this.cameraSettingsCache.setExplicitValue({
                loadArgs: [], value: {
                    status: 'loading',
                    updatedAt: new Date(),
                }
            });
            const updatedSettings = await this.updateSettingsToFpvUrl(newSettings)
            this.cameraSettingsCache.setExplicitValue({
                loadArgs: [], value: {
                    status: 'loaded',
                    value: updatedSettings,
                    updatedAt: new Date(),
                }
            })
            return updatedSettings
        } catch (error) {
            this.cameraSettingsCache.setExplicitValue({
                loadArgs: [], value: {
                    status: 'failed',
                    error,
                    updatedAt: new Date(),
                }
            })
            throw error
        }

    }
}