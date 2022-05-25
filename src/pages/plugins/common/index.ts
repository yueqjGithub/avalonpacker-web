export type PluginsDataRow = {
  id?: string
  name: string
  code: string
  type: string | number
  clientConfigDoc: string
  serverConfigDoc: string
  extra: string
  description: string
}

export type PluginTypeItem = {
  type: string | number
  typeName: string
}
