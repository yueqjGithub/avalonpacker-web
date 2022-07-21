import React from 'react'
import { ATable } from 'avalon-antd-util-client'
import { ChannelDataRow } from '../common'
import { Button, message, Modal, Space } from 'antd'
import { AddButton } from '../../../components/addButton'
import { ReadButton } from '../../../components/readButton'
import { httpApi, httpWithStore } from '../../../service/axios'
import { PermissionHoc } from '../../../components/permissionHOC'
import { ApiIdForSDK } from '../../../service/urls'
import { getApiDataState } from 'avalon-iam-util-client'
import { State } from '../../../store/state'
import { hasPermission } from '../../../utils/utils'
import EditModule from '../modal'
import { UpdateButton } from '../../../components/updateButton/updateButton'
type Props = {
  state: State
  dispatch: any
}

const apiId: ApiIdForSDK = 'channel'
const Main = ({ state, dispatch }: Props) => {
  const { data = [], loading } = getApiDataState<ChannelDataRow[]>({ apiId, state })
  const [target, setTarget] = React.useState<ChannelDataRow>()
  const [showModal, setModal] = React.useState<boolean>()
  const [isEdit, setEdit] = React.useState<boolean>(false)
  const permissionList: { [key: string]: boolean } = {
    a: hasPermission({
      state,
      moduleName: '渠道配置',
      action: '新增'
    }),
    d: hasPermission({
      state,
      moduleName: '渠道配置',
      action: '删除'
    }),
    u: hasPermission({ state, moduleName: '渠道配置', action: '更新' }),
    upload: hasPermission({ state, moduleName: '渠道配置', action: '上传渠道签名' })
  }
  const editSuccess = async () => {
    await httpWithStore({
      apiId,
      state,
      dispatch,
      force: true
    })
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
      <ATable<ChannelDataRow>
        dataSource={data}
        columns={[
          { dataIndex: 'channelName', title: '渠道名称' },
          { dataIndex: 'channelCode', title: '渠道code' },
          {
            dataIndex: 'isMac',
            title: '平台',
            render: val => <span>{val ? 'IOS' : 'Android'}</span>
          },
          {
            title: '操作',
            width: 200,
            filterDropdown: false,
            sorter: undefined,
            render: (record: ChannelDataRow) => {
              return (
                <div className='flex-row'>
                  <PermissionHoc
                    component={
                      <UpdateButton
                        size="small"
                        style={{ marginLeft: '5px' }}
                        onClick={() => {
                          setEdit(true)
                          setTarget(record)
                          setModal(true)
                        }}
                      />
                    }
                    permission={permissionList.u}
                  ></PermissionHoc>
                  <Button
                    size='small'
                    style={{ marginLeft: 5 }}
                    type='primary'
                    onClick={() => {
                      setEdit(false)
                      setTarget(record)
                      setModal(true)
                    }}
                  >详情</Button>
                  <PermissionHoc
                    component={
                      <Button
                        size="small"
                        disabled={!permissionList.d}
                        style={{ marginLeft: '5px' }}
                        danger
                        onClick={async () => {
                          Modal.confirm({
                            content: `确定要删除${record.channelName}吗？`,
                            onOk: () => {
                              deleteHandler(record.id!)
                            }
                          })
                        }}
                      >
                        删除
                      </Button>
                    }
                    permission={permissionList.d}
                  ></PermissionHoc>
                </div>
              )
            }
          }
        ]}
        title={() => {
          return (
            <Space>
              <ReadButton
                disabled={loading || !permissionList.a}
                onClick={() => {
                  httpWithStore({
                    apiId,
                    state,
                    dispatch,
                    force: true
                  })
                }}
              />
              <PermissionHoc
                component={
                  <AddButton
                    disabled={loading}
                    onClick={() => {
                      setEdit(true)
                      setTarget(undefined)
                      setModal(true)
                    }}
                  />
                }
                permission={permissionList.a}
              ></PermissionHoc>
            </Space>
          )
        }}
      ></ATable>
      <Modal title='' footer={false} destroyOnClose width='75vw' visible={showModal} maskClosable={false} onCancel={() => setModal(false)}>
        <EditModule isEdit={isEdit} editSuccess={editSuccess} state={state} dispatch={dispatch} target={target} ></EditModule>
      </Modal>
    </div>
  )
}

export default Main
