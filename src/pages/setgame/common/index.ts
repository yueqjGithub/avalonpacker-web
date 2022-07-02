export type AppDataRow = {
  id?: string
  appId: string
  appName: string
  sourcePath: string
  versionCode: number
  screenOrientation: 'portrait' | 'landscape'
  motherFtpPaths: string
  [key: string]: any
}

export const screenType: {label: string, val: AppDataRow['screenOrientation']}[] = [
  { label: '横屏', val: 'landscape' },
  { label: '竖屏', val: 'portrait' }
]
