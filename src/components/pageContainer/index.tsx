import { CloseCircleFilled } from '@ant-design/icons'
import { Breadcrumb, Button, Spin } from 'antd'
import React, { useState, useEffect, useRef } from 'react'
import { httpWithStore } from '../../service/axios'
import { ApiIdForSDK } from '../../service/urls'
import { State } from '../../store/state'
import { useHistory } from 'react-router-dom'
import { routeConfig } from '../../routes/routes'
import styles from './style.module.scss'
import { ApiRow } from 'avalon-iam-util-client'
import { AxiosResponse } from 'axios'

/**
 *@description 扩展data属性，便于默认请求携带参数，及覆盖apirow中设置
 * */
type ApiDataRow = Partial<ApiRow<ApiIdForSDK>> & {
  id: ApiIdForSDK
  data?: any
  responseTransform?: ((res:AxiosResponse['data']) => AxiosResponse['data']) | null
}

type Props = {
  data: ApiDataRow[],
  state: State,
  dispatch: any,
  children?: JSX.Element | Element
  otherCompnent?: any
}

const getBread = (target: string, list: RouteSingle[]):string[] => {
  const result:string[] = []
  const cur = list.find(item => item.path === target)
  if (cur) {
    result.push(cur.menuName!)
  }
  if (cur?.parent) {
    result.unshift(routeConfig.find(item => item.path === cur.parent)?.menuName!)
  }
  return result
}

export default function PageContainer ({ data, state, dispatch, children, otherCompnent }:Props) {
  const [loadStatus, setLoading] = useState<'loading' | 'resolve' | 'reject'>('resolve')
  const cancelObj = useRef({})
  const history = useHistory()
  const { routeList } = state
  const breadPath = React.useMemo(() => {
    return getBread(history.location.pathname, routeList)
  }, [history])
  const doRequest = () => {
    setLoading('loading')
    Promise.all(data.map(item => {
      cancelObj.current[item.id] = ''
      const requestObj = {
        apiId: item.id,
        state,
        dispatch,
        successStatus: 0,
        cancelPayload: cancelObj.current,
        responseTransform: item.responseTransform || null
      }
      Object.assign(requestObj, item)
      return httpWithStore(requestObj)
    })).then(res => {
      setLoading('resolve')
    }, err => {
      setLoading('reject')
      console.log(err)
    })
  }

  const cancelRequest = () => {
    for (const k in cancelObj.current) {
      if (cancelObj.current[k]) {
        cancelObj.current[k].cancel()
      }
    }
  }

  useEffect(() => {
    if (data.length > 0) {
      doRequest()
    }
    /** 取消请求 */
    return () => {
      cancelRequest()
    }
  }, [])

  const dom = () => {
    switch (loadStatus) {
      case 'loading':
        return (
          <div className='full-width full-height flex-col flex-jst-center flex-ali-center'>
            <Spin></Spin>
            <Button onClick={() => cancelRequest()}>取消请求</Button>
          </div>
        )
      case 'resolve':
        return (
          <>
            {children}
          </>
        )
      case 'reject':
        return (
          <div className='full-width full-height flex-col flex-jst-center flex-ali-center'>
            <CloseCircleFilled style={{ color: '#ff0000', fontSize: '44px', marginBottom: '10px' }}/>
            <span>加载失败</span>
            <Button onClick={() => doRequest()}>重新请求</Button>
          </div>
        )
    }
  }
  return (
    <div className={`${styles.pageContainer} flex-col flex-jst-start flex-ali-start`}>
      <div className='full-width flex-row flex-jst-btw flex-ali-center'>
      <Breadcrumb style={{ marginBottom: 15 }}>
        {
          breadPath.map(item => <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>)
        }
      </Breadcrumb>
      {otherCompnent || null}
      </div>
      {dom()}
    </div>
  )
}
