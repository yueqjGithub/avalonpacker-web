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
