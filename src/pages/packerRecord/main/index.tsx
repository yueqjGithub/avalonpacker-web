import { Badge, Button, message, Modal, Select, Space, Tooltip } from 'antd'
import { ATable } from 'avalon-antd-util-client'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useMemo, useState } from 'react'
import { httpApi, httpWithStore } from '../../../service/axios'
import { ApiIdForSDK } from '../../../service/urls'
import { State } from '../../../store/state'
import { hasPermission } from '../../../utils/utils'
import { ChannelDataRow } from '../../channel/common'
import { RecordDataRow } from '../common'
import SetChannel from '../components/setChannel'
import EditModule from '../components/editModule'
import PluginsSetting from '../components/setPlugins'
import MediaSetting from '../components/setMedia'
// import FailReason from '../components/failReason'
import { PermissionHoc } from '../../../components/permissionHOC'

type Props = {
  state: State
  dispatch: any
}

type TableDataRow = RecordDataRow & { packerStatus?: number, packerTime?: string }

const apiId: ApiIdForSDK = 'packrecord'

const Main = ({ state, dispatch }: Props) => {
  const { currentGame, isMac } = state
  const sysPrefix = isMac ? 'IOS分包' : 'Android分包'
  const { data = [], loading } = getApiDataState<RecordDataRow[]>({ apiId, state })
  // iam
  const { data: iamusers = [] } = getApiDataState<IamUserType[]>({ apiId: 'iamuserlist', state })
  const { data: channelListAll = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const channelList = useMemo(() => {
    return channelListAll.filter(item => item.isMac === isMac)
  }, [channelListAll, isMac])
  // 混合渠道和渠道已有配置数量
  const channelWithConfList = useMemo(() => {
    const result:Array<ChannelDataRow & { count: number }> = []
    channelList.forEach(item => {
      result.push({
        ...item,
        count: data.filter(j => j.channelId === item.id).length
      })
    })
    return result
  }, [channelList, data])
  // 当前选择的渠道
  const [currentChannel, setCurrentChannel] = useState<string[]>([])
  // 根据选择的渠道过滤出列表展示
  const filterDatas = useMemo(() => {
    return data.filter(item => currentChannel.includes(item.channelId))
  }, [currentChannel, data])
  // const { data: mediaList = [] } = getApiDataState<MediaFlagDataRow[]>({ apiId: 'mediaflag', state })
  const [initView, setInitView] = useState<string>()
  const [showChannel, setShowChannel] = useState<boolean>(false)
  const [showPluginSetting, setShowPlugins] = useState<boolean>(false)
  const [showMediaSetting, setShowMedia] = useState<boolean>(false)
  const [showEdit, setEdit] = useState<boolean>(false)
  const [target, setTarget] = useState<RecordDataRow>()
  const permissionList = {
    a: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '添加分包配置' }),
    upload: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '上传母包' }),
    d: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '删除' }),
    setPlugins: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '配置设置插件' }),
    setMedia: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '配置设置媒体标识' }),
    getChannelVersion: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '获取渠道版本' }),
    getChannelSign: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '渠道签名文件列表' }),
    u: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '更新配置' }),
    do: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '分包' }),
    download: hasPermission({ state, moduleName: `${sysPrefix}配置管理`, action: '获取下载链接' })
  }
  const readHandler = async (cancelPayload?) => {
    setCurrentChannel([])
    try {
      await httpWithStore({
        apiId,
        state,
        force: true,
        dispatch,
        data: { appId: currentGame },
        cancelPayload: cancelPayload
      })
    } catch (e) {
      console.log(e)
    }
  }
  useEffect(() => {
    const cancelPayload: any = {}
    readHandler(cancelPayload)
    return () => {
      if (cancelPayload[apiId]) {
        cancelPayload[apiId].cancel()
      }
    }
  }, [currentGame])
  // const couldUseChannel = React.useMemo(() => {
  //   const resultList = channelList.filter(item => !data.find(ele => ele.channelId === item.id))
  //   return resultList
  // }, [channelList, data])

  const editSuccess = async () => {
    setShowChannel(false)
    setEdit(false)
    setShowPlugins(false)
    setShowMedia(false)
    await readHandler()
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
      <ATable<TableDataRow>
        dataSource={filterDatas}
        loading={loading}
        columns={[
          {
            dataIndex: 'channelId',
            title: '渠道',
            sorter: undefined,
            filterDropdown: false,
            render: val => <>{channelList.find(item => item.id === val)?.channelName}</>
          },
          {
            dataIndex: 'configName',
            title: '配置名称',
            sorter: undefined,
            filterDropdown: false
          },
          {
            dataIndex: 'pluginsList',
            title: '插件',
            sorter: undefined,
            filterDropdown: false,
            render: (val, record) => {
              const strs = val ? val.split(',') : []
              return (
                <Badge className='cursor-pointer' count={strs.length}>
                  <div onClick={() => {
                    if (permissionList.setPlugins) {
                      setTarget(record)
                      setShowPlugins(true)
                    } else {
                      Modal.info({
                        title: '提示',
                        content: '您没有权限设置插件'
                      })
                    }
                  }}>
                    <i className='font-30-important iconfont text-primary icon-plus'></i>
                  </div>
                </Badge>
              )
            }
          },
          {
            dataIndex: 'mediaList',
            title: '媒体标识',
            sorter: undefined,
            filterDropdown: false,
            render: (val, record) => {
              const strs = val ? val.split(',') : []
              return (
                <Badge count={strs.length}>
                  <div className='cursor-pointer' onClick={() => {
                    if (permissionList.setMedia) {
                      setTarget(record)
                      setShowMedia(true)
                    } else {
                      Modal.info({
                        title: '提示',
                        content: '您没有权限设置媒体标识'
                      })
                    }
                  }}>
                    <i className='font-30-important iconfont text-primary icon-plus'></i>
                  </div>
                </Badge>
              )
            }
          },
          {
            title: '最近配置修改记录',
            filterDropdown: false,
            sorter: undefined,
            align: 'center',
            width: 220,
            render: record => {
              return (
                <div className='flex-col flex-jst-start flex-ali-center full-width'>
                  <p>{iamusers.find(item => item.id === Number(record.lastUpdateAs))?.name || record.lastUpdateAs}</p>
                  <p>{record.updateTime}</p>
                </div>
              )
            }
          },
          {
            title: '配置参数',
            sorter: undefined,
            filterDropdown: false,
            render: record => {
              return (
                <>
                  <PermissionHoc
                    component={
                      <Button loading={record.loading} size='small' className='custom-btn-pa-sm' icon={<i className='iconfont icon-banshou'></i>} type='primary' onClick={(e) => {
                        setInitView(undefined)
                        setTarget(record)
                        setEdit(true)
                      }}>配置</Button>
                    }
                    permission={permissionList.u}
                  ></PermissionHoc>
                  {
                    !record.couldPack
                      ? <Tooltip title="渠道，插件参数未配置">
                        <i className='iconfont icon-fill-tips text-warning ma-lf-05 font-18' />
                      </Tooltip>
                      : ''
                  }
                </>
              )
            }
          },
          {
            title: '删除',
            sorter: undefined,
            filterDropdown: false,
            render: record => {
              return (
                <div className='flex-row'>
                  <PermissionHoc
                    component={
                      <Button
                        type='primary'
                        size='small'
                        className='custom-btn-pa-sm'
                        icon={<i className='iconfont icon-delete'></i>}
                        disabled={!permissionList.d || record.packerStatus === 1}
                        danger
                        onClick={async () => {
                          Modal.confirm({
                            content: '确定要删除该配置吗？',
                            onOk: async () => {
                              await deleteHandler(record.id!)
                              setCurrentChannel([])
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
              <Select
                showArrow
                allowClear
                maxTagCount='responsive'
                mode='multiple'
                style={{ width: 430 }}
                onChange={selectValue => selectValue && setCurrentChannel(selectValue as string[])}
                placeholder='选择渠道查看配置'
                value={currentChannel}
              >
                {
                  channelWithConfList.map(item => <Select.Option key={item.id} value={item.id!}>{`${item.channelName}（${item.count || 0}）`}</Select.Option>)
                }
              </Select>
              <PermissionHoc
                component={
                  <Button type='primary' onClick={() => {
                    setShowChannel(true)
                  }}>新增分包配置</Button>
                }
                permission={permissionList.a}
              ></PermissionHoc>
            </Space>
          )
        }}
      ></ATable>
      <Modal title='新增分包配置' footer={false} destroyOnClose width='75vw' visible={showChannel} maskClosable={false} onCancel={() => setShowChannel(false)}>
        <SetChannel channelList={channelList} state={state} editSuccess={editSuccess}></SetChannel>
      </Modal>
      <Modal
        title={<>{`分包配置 ${channelList.find(item => item.id === target?.channelId)?.channelName}-${target?.configName}`}</>}
        footer={false}
        destroyOnClose
        width={'75vw'}
        visible={showEdit}
        maskClosable={false}
        onCancel={() => setEdit(false)}
      >
        <EditModule dispatch={dispatch} editSuccess={editSuccess} target={target} initView={initView} state={state}></EditModule>
      </Modal>
      <Modal title='插件配置' footer={false} destroyOnClose width={'75vw'} visible={showPluginSetting} maskClosable={false} onCancel={() => setShowPlugins(false)}>
        <PluginsSetting target={target} state={state} editSuccess={editSuccess} />
      </Modal>
      <Modal title='媒体标识配置' footer={false} destroyOnClose width={'75vw'} visible={showMediaSetting} maskClosable={false} onCancel={() => setShowMedia(false)}>
        <MediaSetting target={target} state={state} editSuccess={editSuccess} />
      </Modal>
    </div>
  )
}

export default Main
