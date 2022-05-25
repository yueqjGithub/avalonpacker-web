import React from 'react'
import { ATable } from 'avalon-antd-util-client'
import { MediaFlagDataRow } from '../common'
import { Button, message, Modal, Space } from 'antd'
import { AddButton } from '../../../components/addButton'
import { httpApi, httpWithStore } from '../../../service/axios'
import { PermissionHoc } from '../../../components/permissionHOC'
import { ApiIdForSDK } from '../../../service/urls'
import { getApiDataState, setApiDataState } from 'avalon-iam-util-client'
import { State } from '../../../store/state'
import { hasPermission } from '../../../utils/utils'
import EditModule from '../modal'
import { UpdateButton } from '../../../components/updateButton/updateButton'
import SearchBar from '../../../components/searchBar'
type Props = {
  state: State
  dispatch: any
}

const apiId: ApiIdForSDK = 'mediaflag'
const Main = ({ state, dispatch }: Props) => {
  const { data = [], loading } = getApiDataState<MediaFlagDataRow[]>({ apiId, state })
  const [target, setTarget] = React.useState<MediaFlagDataRow>()
  const [showModal, setModal] = React.useState<boolean>()
  const searchRef = React.useRef({})
  const permissionList: { [key: string]: boolean } = {
    a: hasPermission({
      state,
      moduleName: '媒体标识',
      action: '新增'
    }),
    d: hasPermission({
      state,
      moduleName: '媒体标识',
      action: '删除'
    }),
    u: hasPermission({ state, moduleName: '媒体标识', action: '更新' })
  }
  const readHandler = async () => {
    const obj = {
      ...searchRef.current
    }
    await httpWithStore({
      apiId,
      state,
      dispatch,
      force: true,
      data: obj
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
  const doSearch = (obj) => {
    searchRef.current = obj
    readHandler()
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
      <ATable<MediaFlagDataRow>
        loading={loading}
        dataSource={data}
        columns={[
          { dataIndex: 'code', title: 'ID', filterDropdown: false },
          { dataIndex: 'mediaName', title: '标识名称', filterDropdown: false },
          { dataIndex: 'createTime', title: '创建时间', filterDropdown: false },
          {
            title: '操作',
            width: 200,
            filterDropdown: false,
            sorter: undefined,
            render: (record: MediaFlagDataRow) => {
              return (
                <div className='flex-row'>
                  <PermissionHoc
                    component={
                      <UpdateButton
                        size="small"
                        style={{ marginLeft: '5px' }}
                        onClick={() => {
                          setTarget(record)
                          setModal(true)
                        }}
                      />
                    }
                    permission={permissionList.u}
                  ></PermissionHoc>
                  <PermissionHoc
                    component={
                      <Button
                        size="small"
                        style={{ marginLeft: '5px' }}
                        danger
                        onClick={async () => {
                          Modal.confirm({
                            content: `确定要删除${record.mediaName}吗？`,
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
            <Space style={{ alignItems: 'flex-start' }}>
               <SearchBar
                searchOptions={[
                  {
                    type: 'input',
                    label: 'ID',
                    keyName: 'code',
                    placeholder: '请输入插件ID'
                  },
                  {
                    type: 'input',
                    label: '标识名称',
                    keyName: 'mediaName',
                    placeholder: '请输入标识名称'
                  }
                ]}
                onSearch={searchOpt => doSearch(searchOpt)}
              />
              <PermissionHoc
                component={
                  <AddButton
                    disabled={loading}
                    onClick={() => {
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
        <EditModule editSuccess={editSuccess} state={state} dispatch={dispatch} target={target} ></EditModule>
      </Modal>
    </div>
  )
}

export default Main
