import { Button, Cascader, Divider, message, Modal, Popover, Select, Tooltip } from 'antd'
import { ATable } from 'avalon-antd-util-client'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { ChangeEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import InnerStatusPage from '../../../components/innerStatusPage'
import { PermissionHoc } from '../../../components/permissionHOC'
import { CancelPayload, httpApi, httpWithStore } from '../../../service/axios'
import { Context } from '../../../store/context'
import { BufferItem, splitFile } from '../../../utils/spliceFileUpload'
import { hasPermission } from '../../../utils/utils'
import { ChannelDataRow } from '../../channel/common'
import { RecordDataRow } from '../../packerRecord/common'
import { HistoryDataRow } from '../../packHistory/common'
import Detail from '../../packHistory/detail'
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
  const { currentGame, user, isMac } = state
  const sysPrefix = isMac ? 'IOS分包' : 'Android分包'
  // iam
  const { data: iamusers = [] } = getApiDataState<IamUserType[]>({ apiId: 'iamuserlist', state })
  // appList
  // const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })

  const [curMotherPack, setMotherPack] = useState<CurrentMotherPack>()
  const [curChannel, setChannel] = useState<string[]>([])
  const [curConfig, setConfigs] = useState<string[]>([])
  const [saveChannel, setSaveChannel] = useState<string[]>([])
  // 母包及渠道列表获取
  const [loading, setInnerLoading] = useState<boolean>(false)
  const [loadStatus, setInnerStatus] = useState<| 'resolve' | 'reject' | 'empty'>('empty')
  const getDatas = async (cancel?: CancelPayload) => {
    setMotherPack(undefined)
    setChannel([])
    setConfigs([])
    try {
      setInnerLoading(true)
      await httpWithStore({
        state,
        dispatch,
        data: { appId: currentGame },
        apiId: 'querySourceList',
        force: true,
        httpCustomConfig: {
          headers: {
            dependPath: '/packer/admin/packerRecord/package',
            dependAction: encodeURIComponent('分包')
          }
        },
        cancelPayload: cancel
      })
      await httpWithStore({
        state,
        dispatch,
        apiId: 'channel',
        force: true,
        httpCustomConfig: {
          headers: {
            dependPath: '/packer/admin/packerRecord/package',
            dependAction: encodeURIComponent('分包')
          }
        },
        cancelPayload: cancel
      })
      await httpWithStore({
        state,
        dispatch,
        data: { appId: currentGame },
        apiId: 'packrecord',
        force: true,
        httpCustomConfig: {
          headers: {
            dependPath: '/packer/admin/packerRecord/package',
            dependAction: encodeURIComponent('分包')
          }
        },
        cancelPayload: cancel
      })
      setInnerStatus('resolve')
    } catch {
      setInnerStatus('reject')
    } finally {
      setInnerLoading(false)
    }
  }
  useEffect(() => {
    const cancel: CancelPayload = {}
    getDatas(cancel)
    return () => {
      for (const k in cancel) {
        if (cancel[k]) {
          cancel[k].cancel()
        }
      }
    }
  }, [currentGame])
  // 权限
  const permissionList = {
    xcode: hasPermission({ state, moduleName: `${sysPrefix}工具`, action: '下载xcode' }), // Xcode
    upload: hasPermission({ state, moduleName: `${sysPrefix}工具`, action: '上传母包' }), // 上传母包
    do: hasPermission({ state, moduleName: `${sysPrefix}工具`, action: '分包' }), // 分包
    download: hasPermission({ state, moduleName: `${sysPrefix}工具`, action: '分包' }) // 下载
  }
  // 母包
  const { data: motherAll } = getApiDataState<MotherPackageResponse>({ apiId: 'querySourceList', state })
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
        httpCustomConfig: {
          headers: {
            dependPath: '/packer/admin/packerRecord/package',
            dependAction: encodeURIComponent('分包')
          }
        },
        data: { appId: currentGame },
        dispatch
      })
    } catch {
      message.error('程序出错：获取母包列表失败')
    }
  }
  const degRef = useRef<number>(0)
  const uploadPiece = async (list: BufferItem[], length: number) => {
    let cur = 0
    const failList: any = []
    while (cur < list.length) {
      const rqList = list.slice(cur, cur + 5)
      const pieceResList = await Promise.allSettled(rqList.map(v => {
        const fm = new FormData()
        fm.append('file', v.file)
        fm.append('appId', currentGame)
        fm.append('fileName', v.fileName)
        fm.append('length', String(length))
        fm.append('idx', String(v.idx))
        fm.append('md5', v.hash)
        fm.append('type', '1')
        return httpApi({
          apiId: 'pieceupload',
          state,
          method: 'POST',
          timeout: 120000,
          data: fm
        }).request
      }))
      const fail = pieceResList.filter(v => v.status === 'rejected' || v.value?.data?.status !== 0)
      failList.push(...fail)
      cur += 5
    }
    return failList.length
  }
  const uploadHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    if (!file) {
      message.error('请选择文件')
      if (uploadRef.current) {
        uploadRef.current.value = ''
      }
      return false
    }
    if (file.name.indexOf(' ') !== -1) {
      message.error('上传文件名禁止包含空格')
      if (uploadRef.current) {
        uploadRef.current.value = ''
      }
      return false
    }
    const fileType = file.name.split('.').pop()
    if (fileType !== 'apk' && fileType !== 'aab' && !isMac) {
      message.error('仅支持apk/aab上传')
      if (uploadRef.current) {
        uploadRef.current.value = ''
      }
      return false
    }
    try {
      setLoading(true)
      const bArr = await splitFile(file, 10)
      // 投石问路
      const fir = bArr[0]
      const firFm = new FormData()
      firFm.append('file', fir.file)
      firFm.append('idx', fir.idx.toString())
      firFm.append('length', bArr.length.toString())
      firFm.append('md5', fir.hash)
      firFm.append('fileName', fir.fileName)
      firFm.append('type', '1')
      firFm.append('appId', currentGame)
      const { data: res } = await httpApi({
        apiId: 'pieceupload',
        state,
        method: 'POST',
        timeout: 120000,
        data: firFm
      }).request
      if (res.status === 0) {
        const { already } = res.data
        if (res.data.complete) {
          // 之前已上传成功
          message.success('上传成功')
          await queryMotherList()
          setMotherPack(['uploadNames', file.name])
        } else {
          const needUploadIdxs = bArr.filter(v => !already.includes(v.idx))
          // 走完人生路
          const pieceResult: number = needUploadIdxs.length > 0 && await uploadPiece(needUploadIdxs, bArr.length)
          degRef.current = 1 - (pieceResult / bArr.length)
          if (pieceResult === 0) {
            message.success('上传成功')
          } else {
            throw new Error('上传结束，但是有部分分片上传失败')
          }
          await queryMotherList()
          setMotherPack(['uploadNames', file.name])
        }
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      Modal.confirm({
        title: `已上传${(degRef.current * 100).toFixed(0)}%`,
        content: '上传文件失败，是否从断开处继续上传？',
        okText: '重新上传',
        cancelText: '取消',
        onOk: () => {
          if (uploadRef.current) {
            uploadRef.current.value = ''
          }
          uploadRef.current!.click()
        }
      })
    } finally {
      if (uploadRef.current) {
        uploadRef.current.value = ''
      }
      setLoading(false)
    }
  }

  // 渠道
  const { data: channelListAll = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const channelList = useMemo(() => {
    return channelListAll.filter(item => item.isMac === isMac)
  }, [channelListAll, isMac])
  // 配置
  const { data: configAll = [] } = getApiDataState<RecordDataRow[]>({ apiId: 'packrecord', state })
  const configList = useMemo(() => {
    return configAll.filter(item => curChannel.includes(item.channelId) && item.couldPack)
  }, [configAll, curChannel])
  const curConfigList = useMemo(() => {
    return configList.filter(item => curConfig.includes(item.id!))
  }, [configList, curConfig])
  const readConfigList = async () => {
    await httpWithStore({
      apiId: 'packrecord',
      state,
      dispatch,
      httpCustomConfig: {
        headers: {
          dependPath: '/packer/admin/packerRecord/package',
          dependAction: encodeURIComponent('分包')
        }
      },
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
      ops: user.id,
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
    } catch (e) {
      setStatus('faild')
      setReason('程序出错')
    } finally {
      setSaveChannel([...curChannel])
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
        httpCustomConfig: { headers: { dependPath: '/packer/admin/packerRecord/package', dependAction: encodeURIComponent('分包') } },
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
  // 下载xcode
  const downloadXHandler = async (channelCode: string) => {
    const requestData = {
      appId: currentGame,
      channel_code: channelCode
    }
    const channelTarget = channelList.find(item => item.id === channelCode)
    const res = await httpApi({
      apiId: 'donwloadxcode',
      data: requestData,
      state,
      httpCustomConfig: {
        responseType: 'blob',
        timeout: 1000 * 60 * 10
      }
    }).request
    if (res.data.type !== 'application/octet-stream') {
      message.error(`${channelTarget?.channelName}下载失败`)
    } else {
      const blob = new Blob([res.data], { type: 'application/octet-stream' })
      const fileName = `${channelTarget?.channelName}.zip`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.style.display = 'none'
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  const downloadXcode = async () => {
    if (saveChannel.length === 0) {
      message.warning('当前选择的渠道为空，无法下载')
      return false
    }
    const rList = saveChannel.map(v => downloadXHandler(v))
    setDownLoading(true)
    await Promise.all(rList)
    setDownLoading(false)
  }
  // 点击打开历史详情
  const [curHis, setHis] = useState<HistoryDataRow['id']>()
  const [showDetail, setShowDetail] = useState<boolean>(false)
  // render
  return (
    <InnerStatusPage
      loadFunc={getDatas}
      loadStatus={loadStatus}
      loading={loading}
    >
    <div className="full-width">
      {/* 头部模块 */}
      <div className='full-width flex-row flex-jst-btw flex-ali-end'>
        <div className='flex-col flex-jst-start flex-ali-start'>
          <div className={styles.cusFormLine}>
            <input type="file" ref={uploadRef} style={{ display: 'none' }} onChange={e => uploadHandler(e)} />
            <div className={styles.label}>选择{isMac ? 'xcode工程' : '母包'}:</div>
            <Cascader
              placeholder="请选择"
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
                <Button disabled={uploadLoading} loading={uploadLoading} type='primary' className='ma-lf-05' onClick={() => {
                  uploadRef.current!.click()
                }}>上传{isMac ? 'xcode工程' : '母包'}</Button>
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
              onChange={val => {
                setChannel(val)
                const copy = [...curConfig]
                const newConfig = copy.filter(v => {
                  const target = configList.find(item => item.id === v)
                  return val.includes(target!.channelId)
                })
                setConfigs(newConfig)
              }}
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
              value={curConfig}
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
            permission={permissionList.xcode && !!isMac}
            component={
              <Button
                icon={<i className='iconfont icon-download'></i>}
                type='primary'
                disabled={packStatus !== 'success' && packStatus !== 'faild'}
                loading={downLoading}
                onClick={() => downloadXcode()}
              >下载Xcode工程</Button>
            }
          ></PermissionHoc>
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
                    <span>{iamusers.find(item => item.id === Number(record.lastUpdateAs))?.name || record.lastUpdateAs}</span>
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
                  <>
                    {record.lastHisId && <Tooltip title="点击查看最近一次分包详情">
                    <div className='full-width flex-col flex-jst-center flex-ali-center cursor-pointer'>
                      <span>{iamusers.find(item => item.id === Number(record.lastOps))?.name || record.lastOps}</span>
                      <span>{record.lastPackTime}</span>
                    </div>
                  </Tooltip>}
                  </>
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
        <Detail target={curHis} state={state} isFromConfig />
      </Modal>
    </div>
    </InnerStatusPage>
  )
}

export default Main
