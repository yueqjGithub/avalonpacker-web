import { Badge, Button, Cascader, message, Modal, Popover, Space, Spin } from 'antd'
import { ATable } from 'avalon-antd-util-client'
import { getApiDataState, setApiDataState } from 'avalon-iam-util-client'
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ReadButton } from '../../../components/readButton'
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
import DownloadModal from '../components/downloadModal'
// import FailReason from '../components/failReason'
import { AppDataRow } from '../../setgame/common'
import dayjs from 'dayjs'
import { PermissionHoc } from '../../../components/permissionHOC'

type Props = {
  state: State
  dispatch: any
}

type TableDataRow = RecordDataRow & { packerStatus?: number, packerTime?: string }

type MotherPackages = {
  fileName: string
  path: string
  size: number
  timestamp: string
}

type MotherPackageResponse = {
  ftpNames: MotherPackages[]
  uploadNames: string[]
}

const apiId: ApiIdForSDK = 'packrecord'

const Main = ({ state, dispatch }: Props) => {
  const { currentGame } = state
  const [curDownload, setDownload] = useState<string[]>([])
  const [showDownload, setShowDownload] = useState<boolean>()
  const { data = [], loading } = getApiDataState<RecordDataRow[]>({ apiId, state })
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  const { data: channelList = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const { data: motherAll = [], loading: motherLoading } = getApiDataState<MotherPackageResponse>({ apiId: 'querySourceList', state })
  const uploadRef = useRef<HTMLInputElement>(null)
  const [uploadLoading, setLoading] = useState<boolean>(false)
  // const { data: mediaList = [] } = getApiDataState<MediaFlagDataRow[]>({ apiId: 'mediaflag', state })
  const [initView, setInitView] = useState<string>()
  const [showChannel, setShowChannel] = useState<boolean>(false)
  const [showPluginSetting, setShowPlugins] = useState<boolean>(false)
  const [showMediaSetting, setShowMedia] = useState<boolean>(false)
  const [showEdit, setEdit] = useState<boolean>(false)
  const [target, setTarget] = useState<RecordDataRow>()
  const { data: statusList = [] } = getApiDataState<any[]>({ apiId: 'querystatus', state })
  // const intervalRef = useRef<number>()
  const motherList = useMemo(() => {
    const result: { value: string, label: string, children?: { value: string, label: string, path?: string }[] }[] = []
    for (const k in motherAll) {
      if (motherAll[k] && motherAll[k].length > 0) {
        result.push({
          label: k === 'uploadNames' ? '上传来源' : 'FTP来源',
          value: k,
          children: k === 'uploadNames' ? motherAll[k].map(v => ({ value: v, label: v })) : (motherAll[k]?.map(v => ({ value: v.fileName, label: v.fileName, path: v.path }) || []))
        })
      }
    }
    return result
  }, [motherAll, currentGame])
  const permissionList = {
    a: hasPermission({ state, moduleName: '配置管理', action: '添加打包记录' }),
    upload: hasPermission({ state, moduleName: '配置管理', action: '上传母包' }),
    d: hasPermission({ state, moduleName: '配置管理', action: '删除' }),
    setPlugins: hasPermission({ state, moduleName: '配置管理', action: '打包记录设置插件' }),
    setMedia: hasPermission({ state, moduleName: '配置管理', action: '打包记录设置媒体标识' }),
    getChannelVersion: hasPermission({ state, moduleName: '配置管理', action: '获取渠道版本' }),
    getChannelSign: hasPermission({ state, moduleName: '配置管理', action: '渠道签名文件列表' }),
    u: hasPermission({ state, moduleName: '配置管理', action: '更新打包记录' }),
    do: hasPermission({ state, moduleName: '配置管理', action: '打包' }),
    download: hasPermission({ state, moduleName: '配置管理', action: '获取下载链接' })
  }
  const cancelPayload: any = {}
  const tableDatas = useMemo(() => {
    const list: Array<TableDataRow> = [...data]
    list.forEach(item => {
      const targetStatus = statusList.find(ele => ele.recordId === item.id)
      if (targetStatus) {
        item.packerStatus = targetStatus.status
        item.versionCode = targetStatus.versionCode
        item.couldDownload = targetStatus.couldDownload
        item.packerTime = targetStatus.packerTime
      }
    })
    return list
  }, [statusList, data])
  const getStatus = async () => {
    const requestData = {
      appId: currentGame
    }
    await httpWithStore({
      apiId: 'querystatus',
      dispatch,
      state,
      force: true,
      data: requestData
    })
  }
  const readHandler = async () => {
    try {
      if (statusList.length === 0) {
        await getStatus()
      }
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
  const bindMother = async (val: Partial<RecordDataRow>, record?: RecordDataRow) => {
    const requestData = record ? { ...record, ...val } : { ...target, ...val }
    try {
      const { data: res } = await httpApi({
        apiId: 'updaterecord',
        data: requestData,
        state,
        method: 'POST'
      }).request
      if (res.status !== 0) {
        message.error(res.message || res.error_msg)
        return false
      } else {
        return true
      }
    } catch {
      message.error('绑定母包出错')
    }
  }
  const queryMotherList = async () => {
    try {
      await httpWithStore({
        apiId: 'querySourceList',
        state,
        force: true,
        data: { appId: currentGame },
        dispatch
      })
    } catch {
      message.error('程序出错：获取已上传母包失败')
    }
  }
  const uploadHandler = async (e:ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : ''
    if (!file) {
      message.error('获取上传信息失败')
      return false
    }
    const fileType = file.name.split('.').pop()
    if (fileType !== 'apk' && fileType !== 'aab') {
      message.error('仅支持apk/aab上传')
      return false
    }

    const fm = new FormData()
    fm.append('file', file)
    fm.append('type', '3')
    const targetApp = gameList.find(item => item.id === target?.appId)
    fm.append('appId', targetApp?.appId!)
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId: 'uploadimg',
        state,
        method: 'POST',
        timeout: 120000,
        data: fm
      }).request
      if (res.status === 0) {
        message.success('上传成功')
        await bindMother({ sourceName: file.name, motherIsFtp: 0 })
        await queryMotherList()
        await readHandler()
      } else {
        message.error(res.error_msg || res.message)
      }
    } catch (e) {
      message.error('上传出错')
    } finally {
      setLoading(false)
    }
  }
  const couldUseChannel = React.useMemo(() => {
    const resultList = channelList.filter(item => !data.find(ele => ele.channelId === item.id))
    return resultList
  }, [channelList, data])

  useEffect(() => {
    readHandler()
    return () => {
      // 临末了把母包list删他妈了，不然进来的时候不加载新的
      setApiDataState({ apiId: 'querySourceList', data: undefined, dispatch })
      if (cancelPayload[apiId]) {
        cancelPayload[apiId].cancel()
      }
    }
  }, [])
  // 根据appid获取各个渠道打包状态
  // useEffect(() => {
  //   if (!intervalRef.current) {
  //     intervalRef.current = setInterval(() => {
  //       getStatus()
  //     }, 3000)
  //   }
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current)
  //       intervalRef.current = undefined
  //     }
  //   }
  // }, [])
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
  const doPackage = async (record) => {
    const requestData = {
      id: record.id
    }
    try {
      record.packerStatus = 1
      const { data: res } = await httpApi({
        apiId: 'dopackage',
        state,
        method: 'POST',
        data: requestData
      }).request
      if (res.status === 0) {
        message.success('已提交打包请求，请耐心等待')
      } else {
        message.error(res.message || res.error_message)
      }
    } catch {
      message.error('程序出错')
    }
  }
  const openDownload = async (record) => {
    record.downloadLoading = true
    const requestData = {
      recordId: record.id
    }
    try {
      const { data: res } = await httpApi({
        apiId: 'getdownload',
        state,
        method: 'POST',
        data: requestData
      }).request
      if (res.status === 0) {
        setDownload(res.data)
        setShowDownload(true)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('程序出错')
    } finally {
      record.downloadLoading = false
    }
  }
  return (
    <div className='full-width'>
      <input type="file" ref={uploadRef} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/>
      <ATable<TableDataRow>
        dataSource={tableDatas}
        loading={loading}
        columns={[
          {
            dataIndex: 'channelId',
            title: '渠道',
            render: val => <>{channelList.find(item => item.id === val)?.channelName}</>
          },
          {
            dataIndex: 'sourceName',
            title: '母包',
            width: 450,
            filterDropdown: false,
            sorter: undefined,
            render: (val, record) => {
              return (
                <Spin spinning={uploadLoading || motherLoading}>
                  <div className='full-width'>
                    {/* <Select loading={motherLoading} placeholder='选择母包' value={record.sourceName} style={{ width: 340 }} dropdownMatchSelectWidth={false} showSearch={true}
                      onChange={async val => {
                        const bindR = await bindMother(val, record)
                        if (bindR) {
                          readHandler()
                        }
                      }}
                    >
                      {
                        motherList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                      }
                    </Select> */}
                    <Cascader
                      style={{ width: 350 }}
                      fieldNames={{ label: 'label', value: 'value', children: 'children' }}
                      options={motherList}
                      showSearch
                      allowClear={false}
                      value={record.motherIsFtp ? ['ftpNames', record.sourceName || ''] : ['uploadNames', record.sourceName || '']}
                      displayRender={(labels, selectedOptions) => {
                        return <span>{labels.pop()}</span>
                      }}
                      onChange={async (val, selectedOptions) => {
                        const result: Partial<RecordDataRow> = {
                          motherIsFtp: selectedOptions[1].path ? 1 : 0,
                          sourceName: val[1]
                        }
                        if (selectedOptions[1].path) {
                          result.ftpPath = selectedOptions[1].path
                        }
                        // if (val[0] === 'ftpNames') {
                        //   result = {
                        //     motherIsFtp: 1,
                        //     ftpPath: val[1]
                        //   }
                        // } else {
                        //   result = {
                        //     motherIsFtp: 0,
                        //     sourceName: val[1]
                        //   }
                        // }
                        const bindR = await bindMother(result, record)
                        if (bindR) {
                          readHandler()
                        }
                      }}
                      // placeholder="Please select"
                    />
                    <PermissionHoc
                      component={
                        <Button disabled={uploadLoading} type='text' onClick={() => {
                          setTarget(record)
                          uploadRef.current!.click()
                        }}><i className='iconfont icon-cloudupload-fill text-primary'></i></Button>
                      }
                      permission={permissionList.upload}
                    ></PermissionHoc>
                  </div>
                </Spin>
              )
            }
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
                    <i className='font-30 iconfont text-primary icon-plus'></i>
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
                    <i className='font-30 iconfont text-primary icon-plus'></i>
                  </div>
                </Badge>
              )
            }
          },
          {
            title: '打包时间',
            filterDropdown: false,
            align: 'center',
            width: 220,
            render: record => <span>{record.packerTime ? dayjs(record.packerTime).format('YYYY年MM月DD日 HH:mm') : '无'}</span>
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
                      !record.couldPack ? <i className='iconfont icon-fill-tips text-warning ma-lf-05 font-18'/> : ''
                    }
                  </>
              )
            }
          },
          {
            title: '打包',
            sorter: undefined,
            filterDropdown: false,
            render: record => {
              return (
                <>
                  <PermissionHoc
                    component={
                      <Button
                        type='primary'
                        size='small'
                        className='custom-btn-pa-sm'
                        style={{ marginLeft: 5 }}
                        loading={record.packerStatus === 1}
                        icon={record.packerStatus === 1 ? '' : <i className='iconfont icon-gongwenbao'></i>}
                        disabled={!record.couldPack || record.packerStatus === 1}
                        onClick={() => {
                          doPackage(record)
                        }}
                      >{record.packerStatus === 1 ? '打包中' : '打包'}</Button>
                    }
                    permission={permissionList.do}
                  ></PermissionHoc>
                  {
                    record.packerStatus === 3
                      ? (
                      <Popover
                      title='打包失败'
                      content={statusList.find(item => item.recordId === record.id)?.reason || '未知错误'}
                    >
                      <i className='iconfont icon-fill-tips text-danger ma-lf-05 font-18'/>
                    </Popover>
                        )
                      : ''
                  }
                </>
              )
            }
          },
          {
            title: '下载',
            sorter: undefined,
            filterDropdown: false,
            render: record => {
              return (
                <PermissionHoc
                  component={
                    <Button
                      size='small'
                      disabled={!record.couldDownload}
                      className={record.couldDownload ? 'btn-success custom-btn-pa-sm' : 'custom-btn-pa-sm'}
                      icon={<i className='iconfont icon-download'></i>}
                      onClick={() => {
                        openDownload(record)
                      }}
                    >下载</Button>
                  }
                  permission={permissionList.download}
                ></PermissionHoc>
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
                            content: '确定要删除该打包记录吗？',
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
                disabled={loading}
                onClick={() => {
                  readHandler()
                }}
              />
              <PermissionHoc
                component={
                  <Button type='primary' onClick={() => {
                    setShowChannel(true)
                  }}>新增打包渠道</Button>
                }
                permission={permissionList.a}
              ></PermissionHoc>
            </Space>
          )
        }}
      ></ATable>
      <Modal title='增加渠道' footer={false} destroyOnClose width='75vw' visible={showChannel} maskClosable={false} onCancel={() => setShowChannel(false)}>
        <SetChannel channelList={couldUseChannel} state={state} editSuccess={editSuccess}></SetChannel>
      </Modal>
      <Modal title='打包配置' footer={false} destroyOnClose width={'75vw'} visible={showEdit} maskClosable={false} onCancel={() => setEdit(false)}>
        <EditModule dispatch={dispatch} editSuccess={editSuccess} target={target} initView={initView} state={state}></EditModule>
      </Modal>
      <Modal title='插件配置' footer={false} destroyOnClose width={'75vw'} visible={showPluginSetting} maskClosable={false} onCancel={() => setShowPlugins(false)}>
        <PluginsSetting target={target} state={state} editSuccess={editSuccess}/>
      </Modal>
      <Modal title='媒体标识配置' footer={false} destroyOnClose width={'75vw'} visible={showMediaSetting} maskClosable={false} onCancel={() => setShowMedia(false)}>
        <MediaSetting target={target} state={state} editSuccess={editSuccess}/>
      </Modal>
      <Modal title='下载' footer={false} destroyOnClose width={'75vw'} visible={showDownload} maskClosable={false} onCancel={() => setShowDownload(false)}>
        <DownloadModal list={curDownload} />
      </Modal>
    </div>
  )
}

export default Main
