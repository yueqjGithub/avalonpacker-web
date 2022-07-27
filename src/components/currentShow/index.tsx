import { message, Modal, Select } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useMemo, useState } from 'react'
import { AppDataRow } from '../../pages/setgame/common'
import { CancelPayload, httpWithStore } from '../../service/axios'
import { ApiIdForSDK } from '../../service/urls'
import { State } from '../../store/state'
import { useHistory } from 'react-router-dom'
import styles from './style.module.scss'
import { didShowThisMenu } from '../../utils/utils'
import { ArrowLeftOutlined } from '@ant-design/icons'

type Props = {
  state: State,
  collapsed: boolean
  dispatch: any
  isCommon?: boolean // 是否公共菜单
}
const apiId: ApiIdForSDK = 'gamelist'
const CurrentShow = ({ state, collapsed, dispatch, isCommon }: Props) => {
  const history = useHistory()
  const { currentGame, routeList } = state
  const [cancelSource] = useState<CancelPayload>()
  const { data = [] } = getApiDataState<AppDataRow[]>({ apiId, state })
  const target = useMemo(() => {
    return data.find(item => item.id === currentGame)
  }, [data, currentGame])
  const getListHandler = async () => {
    try {
      await httpWithStore({
        state,
        dispatch,
        apiId,
        cancelPayload: cancelSource
      })
    } catch {
      message.error('获取当前APP信息失败')
    }
  }
  useEffect(() => {
    if (!isCommon && data.length > 0 && !target) {
      Modal.confirm({
        title: '无法获取当前游戏信息，请先选择游戏',
        okText: '确定',
        cancelButtonProps: {
          style: { display: 'none' }
        },
        onOk: () => {
          history.push('/setGame')
        }
      })
    }
  }, [data])
  useEffect(() => {
    if (data.length === 0) {
      getListHandler()
    }
    return () => {
      if (cancelSource) {
        cancelSource[apiId]?.cancel()
      }
    }
  }, [])
  const toSet = () => {
    history.push('/setGame')
  }
  const to = React.useMemo(() => {
    return routeList.find(item => item.parent !== '/common' && didShowThisMenu({ state, moduleName: item.menuName! }))?.path
  }, [])
  const chooseEffect = (target: AppDataRow['id']) => {
    window.localStorage.setItem('currentGame', target!)
    dispatch({
      type: 'SET_DATA',
      id: 'currentGame',
      value: target
    })
    if (isCommon) {
      history.push(to || '/404')
    }
  }
  return (
    <div className={`full-width cus-left-select flex-wrap flex-row ${collapsed ? 'flex-jst-center' : 'flex-jst-start'} flex-ali-start ${styles.curContainer}`}
      style={{ marginBottom: !isCommon ? '0' : '.1rem' }}
    >
      <div className={styles.curIcon}>
        {target?.appName.substring(0, 1) || '?'}
      </div>
      {
        collapsed
          ? null
          : (
          // <div className={`flex-1 text-primary line-height-1 ${styles.lineHeightControl}`}>{target?.appName || '未选择'}</div>
          <Select value={target?.id} className='flex-1' onSelect={(val, opt) => chooseEffect(val)} placeholder='未选择'>
            {
              data.map(item => <Select.Option key={item.id} value={item.id}>{item.appName}</Select.Option>)
            }
          </Select>
            )
      }
      {
        !isCommon && (
          <div className={`${styles.backContainer} full-width flex-row flex-jst-start flex-ali-center cursor-pointer`} onClick={() => toSet()}>
            <div className={styles.backIcon}>
              <ArrowLeftOutlined />
            </div>
            <div>{collapsed ? '' : '返回公共设置'}</div>
          </div>
        )
      }
      {/* <Button size='small' type='text' icon={<SwapOutlined />} style={{ color: '#40a9ff', marginRight: '.1rem' }} onClick={() => toSet()}>
      </Button> */}
    </div>
  )
}

export default CurrentShow
