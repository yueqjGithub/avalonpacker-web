export type RecordDataRow = {
  id?: string
  appId: string
  channelId: string
  packerName: string
  baseConfig: string
  pluginsConfig: string
  gameName: string
  versionCode: string
  resultType: string
  iconUrl: string
  splashUrl: string
  buildNum: number
  pluginsList?: string
  mediaList?: string
  signFilePath?: string
  signFileKeystorePassword?: string
  signFileKeyPassword?: string
  signFileAlias?: string
  sourceName: string
  publicArea: string
  channelVersion: string
  envCode: string
  couldPack: boolean
  couldDownload: boolean
  ftpPath?: string
  motherIsFtp: 1 | 0
  configName: string
  createAs: string
  lastUpdateAs: string
  updateTime: string
  lastOps: string
  lastPackTime: string
}

export const statusEnum = [
  { status: 0, name: '未打包' },
  { status: 1, name: '打包中' },
  { status: 2, name: '打包成功' },
  { status: 3, name: '打包失败' }
]

export type EnvDataRow = {
  envCode: string
  envDesc: string
  supersdkUrl: string
  avalonsdkUrl: string
}
