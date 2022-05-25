import { Button, message, Modal } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useState } from 'react'
import { AppDataRow } from '../../pages/setgame/common'
import { CancelPayload, httpWithStore } from '../../service/axios'
import { ApiIdForSDK } from '../../service/urls'
import { State } from '../../store/state'
import { useHistory } from 'react-router-dom'
import styles from './style.module.scss'
import { SwapOutlined } from '@ant-design/icons'

type Props = {
  state: State,
  collapsed: boolean
  dispatch: any
}
const apiId: ApiIdForSDK = 'gamelist'
const CurrentShow = ({ state, collapsed, dispatch }: Props) => {
  const history = useHistory()
  const { currentGame } = state
  const [cancelSource] = useState<CancelPayload>()
  const { data = [] } = getApiDataState<AppDataRow[]>({ apiId, state })
  const target = data.find(item => item.id === currentGame)
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
    if (data.length > 0 && !target) {
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
  return (
    <div className={`full-width flex-row ${collapsed ? 'flex-jst-center' : 'flex-jst-start'} flex-ali-start ${styles.curContainer}`}>
      <div className={styles.curIcon}>
        {target?.appName.substring(0, 1) || '?'}
      </div>
      {
        collapsed ? null : <div className={`flex-1 text-primary line-height-1 ${styles.lineHeightControl}`}>{target?.appName || '未选择'}</div>
      }
      <Button size='small' type='text' icon={<SwapOutlined />} style={{ color: '#40a9ff', marginRight: '.1rem' }} onClick={() => toSet()}>
      </Button>
    </div>
  )
}

export default CurrentShow
