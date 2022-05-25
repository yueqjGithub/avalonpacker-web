import { Apis, IamBarValue, JWTKey } from 'avalon-iam-util-client'
import { ProjectInstanceDataRow, UserDataRow } from 'avalon-iam-util-global'
import { routeConfig } from '../routes/routes'
import { ApiIdForSDK, apisForSDK } from '../service/urls'
import { myFlatten } from '../utils/utils'

const RouteList = myFlatten<RouteSingle>(routeConfig, 'childrens', 'path')
export interface State extends IamBarValue {
  apis: Apis<ApiIdForSDK>
  jwtLocalStorageName: string
  [propName: string]: any
  routeList: RouteSingle[]
}

const initStates: State = {
  routeList: RouteList,
  jwtLocalStorageName: JWTKey,
  selectedKeys: ['0'],
  user: {} as UserDataRow,
  internalCommunicationStatus: [],
  project: [],
  status: [],
  iambarLoading: true,
  currentProjectInstance: {} as ProjectInstanceDataRow,
  apis: apisForSDK
}

export default initStates
