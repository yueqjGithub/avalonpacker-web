export type HistoryDataRow = {
  configId: string
  app: string
  appId: string
  channelCode: string
  channelId: string
  channelName: string
  channelVersion: string
  createTime?: string | Date
  id: string
  motherName: string
  motherShortName: string
  recordId: string
  supersdkVersion: string
  packageName: string
  opsUser: string
  envDesc: string
  // @ApiModelProperty("打包状态,1-打包中,2-打包成功,3-打包失败")
  packStatus: 1 | 2 | 3
  reason: string
  motherIsFtp: number
}

export type UploadStoreForm = {
  account: string
  pwd: string
}
