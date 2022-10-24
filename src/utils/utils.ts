import { getApiDataState, IamBarValue } from 'avalon-iam-util-client'
import md5 from 'js-md5'
import dayjs from 'dayjs'
import { State } from '../store/state'

export interface DevToolsData {
    customApiUrl: string
}

/**
 * @description 对象数组拍平，用于authroute拍平路由结构
 * @param list
 * @param key children keyname
 * @param uniKey 用于对比结果中是否已有子级的key值，唯一
 */
export const myFlatten = <T>(list:T[], key:string, uniKey:string, result:T[] = []) => {
  list.forEach(item => {
    if (Array.isArray(item[key])) {
      result.concat(myFlatten(item[key], key, uniKey, result))
    } else {
      if (!result.find(ele => ele[uniKey] === item[uniKey])) {
        result.push(item)
      }
    }
  })
  return result
}

/** 获取api接口地址 */
export function getApiUrl (jsonParam: { state: any }) {
  const { state } = jsonParam
  const { currentProjectInstance } = state
  const { data = {} as DevToolsData } = getApiDataState<DevToolsData>({ apiId: 'devTools', state })
  const { customApiUrl = '' } = data
  return customApiUrl === undefined || customApiUrl === '' ? currentProjectInstance.api_url : customApiUrl
  // return ''
}

/** 判断是否拥有权限 */
export function hasPermission (jsonParam: { state: any; moduleName: string; action?: string }): boolean {
  const { state, moduleName, action } = jsonParam
  const { user, currentProjectInstance } = state as IamBarValue
  return user.resourceInfo!.some(d => {
    return d.projectInstanceId === currentProjectInstance.id && d.moduleName === moduleName && (action === undefined || d.action === action)
  })
}

export function didShowThisMenu (jsonParam: { state: any; moduleName: string }): boolean {
  const { state, moduleName } = jsonParam
  const { user, currentProjectInstance } = state as IamBarValue
  return user.resourceInfo!.some(d => {
    return d.projectInstanceId === currentProjectInstance.id && d.moduleName === moduleName && d.route === 'showmenu'
  })
}

/** 请求数据加密 */
export const addSalt = (data: any): any => {
  const timeData = {
    time: dayjs().unix(),
    ...data
  }
  const arr = Object.entries(timeData)
  arr.sort((a, b) => {
    if (a[0] > b[0]) {
      return 1
    }
    if (a[0] < b[0]) {
      return -1
    }
    return 0
  })
  arr.forEach(item => {
    item[1] = item[1] === undefined ? '' : btoa(encodeURIComponent(String(item[1])))
  })
  let str = ''
  arr.forEach(item => {
    if (item[0] !== 'sign') {
      str += `${item[0]}=${item[1]}`
    }
  })
  str = md5(`${timeData.sign}${str}${timeData.sign}`)
  const result = Object.assign({}, timeData)
  result.sign = str
  return result
}

/** 处理配置中的参数项时用到 */
export const dealJSON = obj => {
  const result: Array<any> = []
  Object.entries(obj).forEach(item => {
    const r: { [key: string]: any } = {}
    r.keyName = item[0]
    r.value = typeof item[1] === 'string' ? item[1] : JSON.stringify(item[1])
    result.push(r)
  })
  return result
}
/** 提交参数项时用到，参见ucdynamic */
export const dealResult = (str:string) => {
  if (str.indexOf('[') !== -1 || str.indexOf('{') !== -1) {
    return JSON.parse(str)
  }
  return str
}

/** 通用信息限制获取 */
export const getLimit = (params: { state: State, moduleName: string, name: string, route: string, limitName: string }): string[] | '*' => {
  // 获取权限ID
  const { state, moduleName, name, route, limitName } = params
  const { currentProjectInstance, user } = state
  const proId = currentProjectInstance.id
  const currentAuth = user.resourceInfo?.filter(item => item.projectInstanceId === proId)
  const target = currentAuth?.find(item => item.moduleName === moduleName && item.action === name && item.route === route)
  const limit = user.policyEffectData.all.find(item => item.value === target?.id)
  return limit?.objectAttr[limitName]
}

/** 复制 */
export const copyHandler = (copyContent) => {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(String(copyContent))
  } else {
    const txt = document.createElement('textarea')
    txt.textContent = String(copyContent)
    txt.style.width = '0'
    txt.style.height = '0'
    document.body.appendChild(txt)
    txt.focus()
    document.execCommand('SelectAll')
    const suc = document.execCommand('Copy')
    document.body.removeChild(txt)
    if (suc) {
      return Promise.resolve()
    } else {
      return Promise.reject(new Error('Copy failed'))
    }
  }
}

/** deeoClone */
export const _deepClone = (obj) => {
  const _obj = JSON.stringify(obj)
  const objClone = JSON.parse(_obj)
  return objClone
}
