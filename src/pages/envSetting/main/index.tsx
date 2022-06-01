import { Button, message, Modal, Popconfirm, Table } from 'antd'
import { getApiDataState, setApiDataState } from 'avalon-iam-util-client'
import React, { useMemo, useState } from 'react'
import { PermissionHoc } from '../../../components/permissionHOC'
import { httpApi, httpWithStore } from '../../../service/axios'
import { ApiIdForSDK } from '../../../service/urls'
import { State } from '../../../store/state'
import { hasPermission } from '../../../utils/utils'
import { EnvDataClass } from '../common'
import EditModule from '../modal'

type Props = {
  state: State
  dispatch: any
}

const apiId: ApiIdForSDK = 'envlist'

const Main = ({ state, dispatch }: Props) => {
  const { data = [] } = getApiDataState<EnvDataClass[]>({ apiId, state })
  const [showModal, setModal] = useState<boolean>(false)
  const [target, setTarget] = useState<EnvDataClass>()
  const permissionList = {
    a: hasPermission({ state, moduleName: '环境配置', action: '新增' }),
    u: hasPermission({ state, moduleName: '环境配置', action: '更新' }),
    d: hasPermission({ state, moduleName: '环境配置', action: '删除' })
  }
  const dataList = useMemo(() => {
    return data.sort((a, b) => a.sortNum - b.sortNum)
  }, [data])
  const readHandler = async () => {
    await httpWithStore({
      apiId,
      state,
      dispatch,
      force: true
    }).catch((err) => {
      message.error(err.message)
    }).finally(() => {
      setApiDataState<any>({ apiId, dispatch, loading: false })
    })
  }
  const editSuccess = async () => {
    await readHandler()
    setModal(false)
  }
  const deleteHandler = async (id: string) => {
    try {
      const res = await httpApi({
        targetId: id,
        apiId,
        method: 'DELETE',
        state,
        needqs: true,
        httpCustomConfig: {
          headers: {
            actionName: encodeURIComponent('删除')
          }
        }
      }).request
      if (res.data.status === 0) {
        message.success('已删除')
        editSuccess()
      } else {
        message.error(res.data.error_msg || res.data.message)
      }
    } catch (e) {
      message.error((e as Error).message)
    }
  }
  return (
    <div className='full-width'>
      <div className='full-width flex-row flex-jst-start flex-ali-center pa-col-sm'>
        <PermissionHoc
          permission={permissionList.a}
          component={
            <Button type='primary' onClick={() => {
              setTarget(undefined)
              setModal(true)
            }}>新增</Button>
          }
        ></PermissionHoc>
      </div>
      <Table<EnvDataClass>
        dataSource={dataList}
        rowKey='envCode'
        columns={[
          { title: '环境名称', dataIndex: 'envDesc' },
          { title: 'CODE', dataIndex: 'envCode' },
          { title: 'supersdkUrl', dataIndex: 'supersdkUrl' },
          { title: 'avalonsdkUrl', dataIndex: 'avalonsdkUrl' },
          {
            title: '启用状态',
            dataIndex: 'enable',
            render: (val: boolean) => {
              return <span className={val ? 'text-success' : 'text-danger'}>{val ? '是' : '否'}</span>
            }
          },
          { title: '排序值', dataIndex: 'sortNum' },
          {
            title: '操作',
            render: (record: EnvDataClass) => {
              return (
                <div className='full-width flex-row flex-jst-start flex-ali-center flex-nowrap'>
                  <PermissionHoc
                    permission={permissionList.u}
                    component={
                      <Button type='primary' size='small' onClick={() => {
                        setTarget(record)
                        setModal(true)
                      }}>编辑</Button>
                    }
                  ></PermissionHoc>
                  <PermissionHoc
                    permission={permissionList.u}
                    component={
                      <Popconfirm
                        title='确定要删除吗？'
                        onConfirm={() => deleteHandler(record.envCode)}
                      >
                        <Button type='primary' danger size='small' className='ma-lf-05'>删除</Button>
                      </Popconfirm>
                    }
                  ></PermissionHoc>
                </div>
              )
            }
          }
        ]}
      ></Table>
      <Modal title='' footer={false} destroyOnClose width='75vw' visible={showModal} maskClosable={false} onCancel={() => setModal(false)}>
        <EditModule editSuccess={editSuccess} target={target} ></EditModule>
      </Modal>
    </div>
  )
}

export default Main
