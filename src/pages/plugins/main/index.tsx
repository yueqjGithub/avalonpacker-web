import React from 'react'
import { ATable } from 'avalon-antd-util-client'
import { PluginsDataRow, PluginTypeItem } from '../common'
import { Button, message, Modal } from 'antd'
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

const apiId: ApiIdForSDK = 'plugins'
const Main = ({ state, dispatch }: Props) => {
  const { data = [], loading } = getApiDataState<PluginsDataRow[]>({ apiId, state })
  const { data: types = [] } = getApiDataState<PluginTypeItem[]>({ apiId: 'pluginstypes', state })
  const [target, setTarget] = React.useState<PluginsDataRow>()
  const [showModal, setModal] = React.useState<boolean>()
  const [isEdit, setEdit] = React.useState<boolean>(false)
  const searchRef = React.useRef({})
  const permissionList: { [key: string]: boolean } = {
    a: hasPermission({
      state,
      moduleName: '插件配置',
      action: '新增'
    }),
    d: hasPermission({
      state,
      moduleName: '插件配置',
      action: '删除'
    }),
    u: hasPermission({ state, moduleName: '插件配置', action: '更新' })
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
      <ATable<PluginsDataRow>
        loading={loading}
        dataSource={data}
        columns={[
          { dataIndex: 'name', title: '插件名称', filterDropdown: false },
          {
            dataIndex: 'type',
            title: '类型',
            key: 'type',
            render: (val, record) => {
              return <>{types.find(item => String(item.type) === String(val))?.typeName}</>
            },
            filterDropdown: false
          },
          { dataIndex: 'code', title: 'CODE', sorter: undefined, filterDropdown: false },
          {
            title: '操作',
            width: 200,
            filterDropdown: false,
            sorter: undefined,
            render: (record: PluginsDataRow) => {
              return (
                <div className='flex-row'>
                  <PermissionHoc
                    component={
                      <UpdateButton
                        size="small"
                        style={{ marginLeft: '5px' }}
                        disabled={!permissionList.a}
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
                      style={{ marginLeft: '5px' }}
                      danger
                      onClick={async () => {
                        Modal.confirm({
                          content: `确定要删除${record.name}吗？`,
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
            <div className='flex-row flex-jst-start flex-ali-start'>
              <div>
              <SearchBar
                searchOptions={[
                  {
                    type: 'input',
                    label: '插件名称',
                    keyName: 'name',
                    placeholder: '请输入插件名称'
                  },
                  {
                    type: 'select',
                    label: '类型',
                    keyName: 'type',
                    placeholder: '请选择类型',
                    source: types.map(item => {
                      return { label: item.typeName, value: item.type }
                    })
                  }
                ]}
                onSearch={searchOpt => doSearch(searchOpt)}
              />
              </div>
              <PermissionHoc
                component={
                  <AddButton
                    disabled={loading}
                    style={{ marginLeft: 5 }}
                    onClick={() => {
                      setEdit(true)
                      setTarget(undefined)
                      setModal(true)
                    }}
                  />
                }
                permission={permissionList.a}
              ></PermissionHoc>
            </div>
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
