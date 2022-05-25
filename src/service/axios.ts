import { setApiDataState } from 'avalon-iam-util-client'
import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios'
import { State } from '../store/state'
import { ApiIdForSDK } from './urls'
// import { addSalt } from '../utils/utils'
import querystring from 'querystring'
import { message } from 'antd'
const http = axios.create({
  timeout: 30000
})

http.interceptors.request.use(config => {
  const token = window.sessionStorage.getItem('iamJwt')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(response => {
  return response
}, err => {
  return Promise.reject(err)
})

type HttpMethods = (params: HttpOptions) => { request: AxiosPromise<any>, cancel: CancelTokenSource }

/** 常规http参数 */
interface HttpOptions {
  targetId?: string | number,
  apiId: ApiIdForSDK
  data?: any
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  state: State
  httpCustomConfig?: AxiosRequestConfig | null
  urlTranform?: ({ url: string, state: State }) => string
  needqs?: boolean,
  timeout?: number
}
export type CancelPayload = {
  // eslint-disable-next-line no-unused-vars
  [k in ApiIdForSDK]?: CancelTokenSource | null
}

/** 存入Store的http参数 */
interface HttpWithDispatchOptions extends HttpOptions {
  dispatch: any,
  /** 处理返回 */
  responseTransform?: ((res:AxiosResponse['data']) => AxiosResponse['data']) | null
  /** 是否强制请求 */
  force?: boolean
  /** 成功状态定义 */
  successStatus?: string | number
  /** 取消请求载体 */
  cancelPayload?: Partial<CancelPayload> | null
}

interface HttpParams extends AxiosRequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: any,
  data?: any,
  headers?: AxiosRequestConfig['headers']
}
/**
 * @description 自定义http请求，不存入state
 * @returns request:组装好的请求方法
 * @returns cancel:Axios.CancelTokenSource
 * */
const httpApi:HttpMethods = ({
  targetId,
  apiId,
  data,
  state,
  method = 'GET',
  urlTranform = undefined,
  needqs = false,
  timeout = undefined,
  httpCustomConfig = null
}) => {
  // data = addSalt(data)
  /** URL处理 */
  const cancel = axios.CancelToken.source()
  const { apis } = state
  const target = apis.find(item => item.id === apiId) || null
  if (!target) {
    throw new Error('api无效')
  }
  const URI = urlTranform ? urlTranform({ url: target.url, state }) : (target.urlTranform ? target.urlTranform({ url: target.url, state }) : target.url)
  let options:HttpParams = {
    url: targetId ? `${URI.split('?')[0]}/${targetId}` : URI,
    method
  }
  if (method === 'GET' || method === 'DELETE') {
    options.params = data
  } else {
    options.data = data
  }

  if (needqs) {
    options.data = querystring.stringify(data)
  }

  if (httpCustomConfig) {
    options = Object.assign(options, httpCustomConfig)
  } else if (target.httpCustomConfig) {
    options = Object.assign(options, target.httpCustomConfig)
  }
  if (options.headers) {
    options.headers.actionName = options.headers.actionName ? options.headers.actionName : encodeURIComponent(target.name)
  } else {
    options.headers = { actionName: encodeURIComponent(target.name) }
  }
  if (timeout !== undefined) {
    options.timeout = timeout
  }
  options.cancelToken = cancel.token
  return { request: http(options), cancel }
}

const httpWithStore = async ({
  targetId,
  apiId,
  data,
  state,
  dispatch,
  method = 'GET',
  force = false,
  successStatus = 0,
  responseTransform = null,
  cancelPayload = null,
  urlTranform = undefined,
  needqs = false,
  httpCustomConfig = null
}: HttpWithDispatchOptions) => {
  const cancel = axios.CancelToken.source()
  // data = addSalt(data)
  /** URL处理 */
  const { apis } = state
  const target = apis.find(item => item.id === apiId) || null
  if (!target) {
    throw new Error('api无效')
  }
  const URI = urlTranform ? urlTranform({ url: target.url, state }) : (target.urlTranform ? target.urlTranform({ url: target.url, state }) : target.url)
  let options:HttpParams = {
    url: targetId ? `${URI.split('?')[0]}/${targetId}` : URI,
    method
  }
  if (method === 'GET' || method === 'DELETE') {
    options.params = data
  } else {
    options.data = data
  }
  if (needqs) {
    options.data = querystring.stringify(data)
  }
  if (httpCustomConfig) {
    options = Object.assign(options, httpCustomConfig)
  } else if (target.httpCustomConfig) {
    options = Object.assign(options, target.httpCustomConfig)
  }
  if (options.headers) {
    options.headers.actionName = options.headers.actionName ? options.headers.actionName : encodeURIComponent(target.name)
  } else {
    options.headers = { actionName: encodeURIComponent(target.name) }
  }
  options.cancelToken = cancel.token
  if (cancelPayload !== null) {
    cancelPayload[apiId] = cancel
  }
  try {
    if (!force && state[`${apiId}Data`]) {
      return true
    } else {
      setApiDataState({ apiId, dispatch, loading: true })
      let { data } = await http(options)
      if (responseTransform) {
        data = responseTransform(data)
      }
      if (cancelPayload !== null) {
        cancelPayload[apiId] = null
      }
      setApiDataState({ apiId, dispatch, loading: false })
      if (data.status === successStatus) {
        setApiDataState({ apiId, dispatch, data: data.data })
        return true
      } else {
        throw new Error(`${target.name}:${data.message || data.error_msg}`)
      }
    }
  } catch (e: any) {
    // console.log(e instanceof axios.Cancel)
    if (cancelPayload !== null) {
      cancelPayload[apiId] = null
    }
    if (e.message) {
      message.error(e.message)
    }
    throw new Error((e as Error).message)
  }
}

export { httpApi, httpWithStore }
