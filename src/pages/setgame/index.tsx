import { Button, Descriptions, Divider, message, Modal, Spin } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useState } from 'react'
import { CancelPayload, httpWithStore } from '../../service/axios'
import { ApiIdForSDK } from '../../service/urls'
import { State } from '../../store/state'
import { AppDataRow } from './common'
import SearchBar from '../../components/searchBar'
import styles from './styles.module.scss'
import AppItem from './item'
import { PlusOutlined } from '@ant-design/icons'
import EditModule from './modal'
import { useHistory } from 'react-router-dom'
import { didShowThisMenu, hasPermission } from '../../utils/utils'
type Props = {
  state: State
  dispatch: any
}

type SearchOptions = {
  appId: string
  appName: string
}

const apiId: ApiIdForSDK = 'gamelist'

const SetGame = ({ state, dispatch }: Props) => {
  const searchOptions = React.useRef({})
  const history = useHistory()
  const { routeList } = state
  const [cancelSource] = useState<CancelPayload>()
  const { data = [], loading } = getApiDataState<AppDataRow[]>({ apiId, state })
  const [showModal, setModal] = useState<boolean>(false)
  const [showDetail, setDetail] = useState<boolean>(false)
  const [target, setTarget] = useState<AppDataRow>()
  const permissionList = {
    a: hasPermission({ state, moduleName: '应用管理', action: '新增' }),
    u: hasPermission({ state, moduleName: '应用管理', action: '更新' }),
    d: hasPermission({ state, moduleName: '应用管理', action: '删除' }),
    upload: hasPermission({ state, moduleName: '应用管理', action: '应用签名上传' })
  }
  const getListHandler = async () => {
    const requestData = {
      ...searchOptions.current
    }
    try {
      await httpWithStore({
        state,
        dispatch,
        apiId,
        data: requestData,
        force: true,
        cancelPayload: cancelSource
      })
    } catch {
      message.error('获取应用列表失败')
    }
  }

  useEffect(() => {
    getListHandler()
    return () => {
      if (cancelSource) {
        cancelSource[apiId]?.cancel()
      }
    }
  }, [])

  const doSearch = (obj: SearchOptions) => {
    searchOptions.current = obj
    getListHandler()
  }
  const editSuccess = async () => {
    await getListHandler()
    setModal(false)
  }
  const updateApp = (target: AppDataRow) => {
    setTarget(target)
    setModal(true)
  }
  const openDetail = (target: AppDataRow) => {
    setTarget(target)
    setDetail(true)
  }
  const to = React.useMemo(() => {
    return routeList.find(item => item.parent !== '/common' && didShowThisMenu({ state, moduleName: item.menuName! }))?.path
  }, [])
  const chooseEffect = (target: AppDataRow) => {
    window.localStorage.setItem('currentGame', target.id!)
    dispatch({
      type: 'SET_DATA',
      id: 'currentGame',
      value: target.id
    })
    const { beforeRouter } = state
    if (beforeRouter) {
      const copy = beforeRouter
      dispatch({
        type: 'SET_DATA',
        id: 'beforeRouter',
        value: undefined
      })
      history.push(copy)
    } else {
      history.push(to || '/404')
    }
  }
  return (
    <div className={`flex-col flex-jst-start flex-ali-center scroll-bar ${styles.Container}`}>
      <SearchBar
        searchOptions={[
          {
            type: 'input',
            label: 'APPID',
            keyName: 'appId',
            placeholder: '请输入appId'
          },
          {
            type: 'input',
            label: 'APP名称',
            keyName: 'appName',
            placeholder: '请输入APP名称'
          }
        ]}
        onSearch={(searchOpt: SearchOptions) => doSearch(searchOpt)}
      />
      <Divider></Divider>
      {
        loading
          ? <Spin />
          : (
          <div className='full-width pa-row-lg flex-row flex-jst-start flex-ali-start flex-wrap'>
            {
              data.map(item => <AppItem permissionList={permissionList} setCurrentGame={chooseEffect} openDetail={openDetail} updateApp={updateApp} freshHandler={editSuccess} state={state} key={item.id} target={item}/>)
            }
            {
              permissionList.a && <div className={styles.CtlItem}>
              <div className={`${styles.CtlAdd} flex-row flex-jst-center flex-ali-center`}>
                <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={() => {
                  setTarget(undefined)
                  setModal(true)
                }}/>
              </div>
            </div>
            }
          </div>
            )
      }
      <Modal title='' visible={showModal} footer={false} onCancel={() => setModal(false)} destroyOnClose width='70vw' maskClosable={false}>
        <EditModule permissionList={permissionList} target={target} state={state} editSuccess={() => editSuccess()}></EditModule>
      </Modal>
      <Modal title={target?.appName} visible={showDetail} footer={false} onCancel={() => setDetail(false)} destroyOnClose width='50vw' maskClosable={false}>
        <Descriptions column={1}>
          <Descriptions.Item label="sign_file_path">{target?.signFilePath}</Descriptions.Item>
          <Descriptions.Item label="sign_file_keystore_password">{target?.signFileKeystorePassword}</Descriptions.Item>
          <Descriptions.Item label="sign_file_key_password">{target?.signFileKeyPassword}</Descriptions.Item>
          <Descriptions.Item label="sign_file_alias">{target?.signFileAlias}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  )
}

export default SetGame
