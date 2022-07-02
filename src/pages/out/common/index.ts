import { PluginsDataRow } from '../../plugins/common'
export type MotherPackages = {
  fileName: string
  path: string
  size: number
  timestamp: string
}

export type MotherPackageResponse = {
  ftpNames: MotherPackages[]
  uploadNames: string[]
}

export type CurrentMotherPack = ['ftpNames' | 'uploadNames', string]

export type ChannelMediaPackage = {
  id: string
  hrId: string
  packageName: string
  mediaName: string
  downUrl: string
}

export class HistoryDetailVo {
    id?: string

    configId?: string

    appId?: string

    app?: string

    channelId?: string
    channelCode?: string

    channelName?: string

    channelVersion?: string

    supersdkVersion?: string

    motherShortName?: string

    motherName?: string

    createTime?: string

    pluginsList: PluginsDataRow[] = []

    mediaFinishedPackagesList: Array<ChannelMediaPackage> = [];

    downloadHost?: string
}
