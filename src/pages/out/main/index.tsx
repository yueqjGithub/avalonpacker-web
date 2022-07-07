import { Button, Cascader, Divider, message, Modal, Popover, Select, Tooltip } from 'antd'
import { ATable } from 'avalon-antd-util-client'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { ChangeEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PermissionHoc } from '../../../components/permissionHOC'
import { httpApi, httpWithStore } from '../../../service/axios'
import { Context } from '../../../store/context'
import { ChannelDataRow } from '../../channel/common'
import { RecordDataRow } from '../../packerRecord/common'
import { HistoryDataRow } from '../../packHistory/common'
import Detail from '../../packHistory/detail'
import { AppDataRow } from '../../setgame/common'
import { CurrentMotherPack, HistoryDetailVo, MotherPackageResponse } from '../common'
import styles from '../common/styles.module.scss'
import DownloadModal from '../component/download'

type ReasonType = {
  configName: string,
  reason: string
}[] | string

const Main = () => {
  const timeOutRef = useRef<number>(-1)
  const { state, dispatch } = useContext(Context)
  const { currentGame, user } = state
  // appList
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  // 权限
  const permissionList = {
    upload: true, // 上传母包
    do: true, // 分包
    download: true // 下载
  }
  // 母包
  const { data: motherAll } = getApiDataState<MotherPackageResponse>({ apiId: 'querySourceList', state })
  const [curMotherPack, setMotherPack] = useState<CurrentMotherPack>()
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
  const [uploadLoading, setLoading] = useState<boolean>(false)
  const uploadRef = useRef<HTMLInputElement>(null)
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
      message.error('程序出错：获取母包列表失败')
    }
  }
  const uploadHandler = async (e: ChangeEvent<HTMLInputElement>) => {
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
    fm.append('appId', gameList.find(item => item.id === currentGame)?.appId || '')
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
        await queryMotherList()
        setMotherPack(['uploadNames', file.name])
      } else {
        message.error(res.error_msg || res.message)
      }
    } catch (e) {
      message.error('上传出错')
    } finally {
      if (uploadRef.current) {
        uploadRef.current.value = ''
      }
      setLoading(false)
    }
  }

  // 渠道
  const { data: channelList = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const [curChannel, setChannel] = useState<string[]>([])
  // 配置
  const { data: configAll = [] } = getApiDataState<RecordDataRow[]>({ apiId: 'packrecord', state })
  const configList = useMemo(() => {
    return configAll.filter(item => curChannel.includes(item.channelId) && item.couldPack)
  }, [configAll, curChannel])
  const [curConfig, setConfigs] = useState<string[]>([])
  const curConfigList = useMemo(() => {
    return configList.filter(item => curConfig.includes(item.id!))
  }, [configList, curConfig])
  const readConfigList = async () => {
    await httpWithStore({
      apiId: 'packrecord',
      state,
      dispatch,
      data: { appId: currentGame },
      force: true
    })
  }
  // 查询打包状态
  const [historyIds, setHistoryIds] = useState<string[]>([])
  const [reason, setReason] = useState<ReasonType>('')
  const [packStatus, setStatus] = useState<'loading' | 'success' | 'faild'>()

  const queryStatus = async (cancelNext?: boolean) => {
    // packerstatus
    const requestData = {
      hisIds: historyIds
    }
    try {
      const { data: res }: { data: { data: HistoryDataRow[] } } = await httpApi({
        apiId: 'querystatus',
        data: requestData,
        state,
        method: 'POST',
        httpCustomConfig: {
          headers: {
            actionName: encodeURIComponent('')
          }
        }
      }).request
      const packEnd = res.data.filter(item => item.packStatus === 1).length === 0
      if (packEnd) {
        const failedList = res.data.filter(item => item.packStatus === 3)
        if (failedList.length > 0) {
          const failReasons = failedList.map(item => {
            return {
              configName: configList.find(j => j.id === item.configId)?.configName || '',
              reason: item.reason
            }
          })
          setReason(failReasons)
          setStatus('faild')
        } else {
          setStatus('success')
        }
        setLoading(false)
        // setHistoryIds([])
        readConfigList() // 读取configList,刷新最近打包(成功)时间,
        // 操作结束后清空凭证队列
      } else {
        if (!cancelNext) {
          timeOutRef.current = setTimeout(() => {
            queryStatus()
          }, 2000)
        }
      }
    } catch (e) {
      if ((e as Error).message) {
        message.error((e as Error).message)
      }
      if (!cancelNext) {
        timeOutRef.current = setTimeout(() => {
          queryStatus()
        }, 2000)
      }
    }
  }
  // 分包
  const doPackage = async () => {
    const requestData: any = {
      id: currentGame,
      channelId: curChannel,
      motherPackage: curMotherPack![1],
      configs: curConfig,
      ops: user.username,
      motherIsFtp: curMotherPack![0] === 'ftpNames' ? 1 : 0
    }
    if (curMotherPack![0] === 'ftpNames') {
      requestData.ftpPath = motherAll?.ftpNames.find(item => item.fileName === curMotherPack![1])?.path
    }
    try {
      setStatus('loading')
      const { data: res } = await httpApi({
        apiId: 'dopackage',
        state,
        method: 'POST',
        data: requestData
      }).request
      if (res.status === 0) {
        if (res.data.hisList.length > 0) {
          setHistoryIds(res.data.hisList)
          message.success('服务器正在打包,请耐心等待')
        } else {
          setStatus(undefined)
        }
        if (res.data.denyList.length > 0) {
          message.warning(`${res.data.denyList.join(',')}配置正在正在被使用，请稍后再试`)
        }
        // queryStatus()
      } else {
        setStatus('faild')
        // setHistoryIds([])
        setReason(res.message)
      }
    } catch {
      setStatus('faild')
      setReason('程序出错')
    }
  }
  useEffect(() => {
    if (historyIds.length > 0) {
      queryStatus()
    }
    return () => {
      clearTimeout(timeOutRef.current)
    }
  }, [historyIds])
  // 下载按钮
  const [downLoading, setDownLoading] = useState<boolean>()
  const [downList, setDownList] = useState<HistoryDetailVo[]>()
  const [showDown, setShowDown] = useState<boolean>()
  const queryDownload = async () => {
    const requestData = {
      ids: historyIds
    }
    try {
      setDownLoading(true)
      const { data: res } = await httpApi({
        apiId: 'historydetail',
        data: requestData,
        method: 'POST',
        state
      }).request
      if (res.status === 0) {
        setDownList(res.data)
        setShowDown(true)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('程序错误')
    } finally {
      setDownLoading(false)
    }
  }
  // 点击打开历史详情
  const [curHis, setHis] = useState<HistoryDataRow['id']>()
  const [showDetail, setShowDetail] = useState<boolean>(false)
  // render
  return (
    <div className="full-width">
      {/* 头部模块 */}
      <div className='full-width flex-row flex-jst-btw flex-ali-end'>
        <div className='flex-col flex-jst-start flex-ali-start'>
          <div className={styles.cusFormLine}>
            <input type="file" ref={uploadRef} style={{ display: 'none' }} onChange={e => uploadHandler(e)} />
            <div className={styles.label}>选择母包:</div>
            <Cascader
              placeholder="请选择母包"
              style={{ width: 450 }}
              fieldNames={{ label: 'label', value: 'value', children: 'children' }}
              options={motherList}
              showSearch
              allowClear={false}
              value={curMotherPack}
              displayRender={(labels, selectedOptions) => {
                return <span>{labels.pop()}</span>
              }}
              onChange={async (val:any) => {
                setMotherPack(val)
              }}
            />
            <PermissionHoc
              component={
                <Button disabled={uploadLoading} type='primary' className='ma-lf-05' onClick={() => {
                  uploadRef.current!.click()
                }}>上传母包</Button>
              }
              permission={permissionList.upload}
            ></PermissionHoc>
          </div>
          <div className={styles.cusFormLine}>
            <div className={styles.label}>选择渠道:</div>
            <Select
              placeholder='请选择渠道'
              showSearch
              mode='multiple'
              style={{ width: 450 }}
              value={curChannel}
              onChange={val => setChannel(val)}
              filterOption={(val, opt) => {
                return (opt?.children as unknown as string)?.indexOf(val) !== -1
              }}
            >
              {
                channelList.map(item => <Select.Option key={item.id} value={item.id}>{item.channelName}</Select.Option>)
              }
            </Select>
          </div>
          <div className={styles.cusFormLine}>
            <div className={styles.label}>选择配置:</div>
            <Select
              style={{ width: 450 }}
              disabled={!curChannel}
              placeholder={curChannel ? '请选择配置' : '请先选择渠道'}
              mode='multiple'
              showSearch
              filterOption={(val, opt) => {
                return (opt?.children as unknown as string)?.indexOf(val) !== -1
              }}
              onChange={(val, opt) => {
                setConfigs(val)
              }}
            >
              {
                configList.map(item => <Select.Option key={item.id} value={item.id}>{item.configName}</Select.Option>)
              }
            </Select>
          </div>
        </div>
        {/* 打包区域 */}
        <div className='flex-row flex-jst-end flex-ali-center'>
          {
            packStatus === 'faild' && (
              <Popover
                arrowPointAtCenter
                title='打包失败'
                content={typeof reason === 'string'
                  ? reason
                  : (
                  <>
                    {
                      reason && reason.map(item => {
                        return <p key={item.configName}>{item.configName}:{item.reason}</p>
                      })
                    }
                  </>
                    ) || '未知错误'}
              >
                <i className='iconfont icon-fill-tips text-danger ma-lf-05 font-18'/>
              </Popover>
            )
          }
          <PermissionHoc
            permission={permissionList.do}
            component={
              <Button
                icon={<i className='iconfont icon-gongwenbao'></i>}
                type='primary'
                className='ma-lf-05'
                disabled={curConfig.length === 0 || !curMotherPack}
                loading={packStatus === 'loading'}
                onClick={() => doPackage()}
              >
                分包
              </Button>
            }
          ></PermissionHoc>
          <PermissionHoc
            permission={permissionList.download}
            component={
              <Button
                icon={<i className='iconfont icon-download'></i>}
                type='primary'
                className='ma-lf-05'
                disabled={packStatus !== 'success'}
                loading={downLoading}
                onClick={() => queryDownload()}
              >
                下载
              </Button>
            }
          ></PermissionHoc>
        </div>
      </div>
      {/* 列表区域 */}
      <Divider></Divider>
      <div className='full-width'>
        <ATable
          dataSource={curConfigList}
          rowKey='id'
          pagination={{
            hideOnSinglePage: true
          }}
          columns={[
            {
              title: '渠道',
              dataIndex: 'channelId',
              align: 'center',
              sorter: undefined,
              render: val => <span>{channelList.find(item => item.id === val)?.channelName}</span>
            },
            {
              title: '自定义配置名',
              align: 'center',
              dataIndex: 'configName',
              sorter: undefined
            },
            {
              title: '最近配置修改记录',
              align: 'center',
              sorter: undefined,
              filterDropdown: false,
              render: (record: RecordDataRow) => {
                return (
                  <div className='full-width flex-col flex-jst-center flex-ali-center'>
                    <span>{record.lastUpdateAs}</span>
                    <span>{record.updateTime}</span>
                  </div>
                )
              }
            },
            {
              title: '最近分包记录',
              align: 'center',
              sorter: undefined,
              filterDropdown: false,
              onCell: (record) => {
                return {
                  onClick: () => {
                    setHis(record.lastHisId)
                    setShowDetail(true)
                  }
                }
              },
              render: (record: RecordDataRow) => {
                return (
                  <Tooltip title="点击查看最近一次分包详情">
                    <div className='full-width flex-col flex-jst-center flex-ali-center cursor-pointer'>
                      <span>{record.lastOps || '无'}</span>
                      <span>{record.lastPackTime}</span>
                    </div>
                  </Tooltip>
                )
              }
            }
          ]}
        ></ATable>
      </div>
      <Modal footer={null} destroyOnClose width='80vw' title="下载" visible={showDown} onCancel={() => setShowDown(false)}>
        <DownloadModal configList={curConfigList} historyList={downList!} state={state} ></DownloadModal>
      </Modal>
      <Modal footer={null} destroyOnClose width="80vw" title="分包详情" visible={showDetail} onCancel={() => setShowDetail(false)}>
        <Detail target={curHis} state={state} />
      </Modal>
    </div>
  )
}

export default Main
