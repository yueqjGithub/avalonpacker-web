import { Button, Cascader, Divider, message, Select } from 'antd'
import { ATable } from 'avalon-antd-util-client'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { ChangeEvent, useContext, useMemo, useRef, useState } from 'react'
import { PermissionHoc } from '../../../components/permissionHOC'
import { httpApi, httpWithStore } from '../../../service/axios'
import { Context } from '../../../store/context'
import { ChannelDataRow } from '../../channel/common'
import { RecordDataRow } from '../../packerRecord/common'
import { AppDataRow } from '../../setgame/common'
import { CurrentMotherPack, MotherPackageResponse } from '../common'
import styles from '../common/styles.module.scss'
const Main = () => {
  const { state, dispatch } = useContext(Context)
  const { currentGame } = state
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
  const [curChannel, setChannel] = useState<string>()
  // 配置
  const { data: configAll = [] } = getApiDataState<RecordDataRow[]>({ apiId: 'packrecord', state })
  const configList = useMemo(() => {
    return configAll.filter(item => item.channelId === curChannel && item.couldPack)
  }, [configAll, curChannel])
  const [curConfig, setConfigs] = useState<string[]>([])
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
              style={{ width: 350 }}
              fieldNames={{ label: 'label', value: 'value', children: 'children' }}
              options={motherList}
              showSearch
              allowClear={false}
              value={curMotherPack}
              displayRender={(labels, selectedOptions) => {
                return <span>{labels.pop()}</span>
              }}
              onChange={async (val, selectedOptions) => {
                console.log(val, selectedOptions)
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
              style={{ width: 350 }}
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
              style={{ width: 350 }}
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
          <PermissionHoc
            permission={permissionList.do}
            component={
              <Button
                icon={<i className='iconfont icon-gongwenbao'></i>}
                type='primary'
                disabled={curConfig.length === 0 || !curMotherPack}
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
          dataSource={configList.filter(item => curConfig.includes(item.id!))}
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
              render: (record: RecordDataRow) => {
                return (
                  <div className='full-width flex-col flex-jst-center flex-ali-center'>
                    <span>{record.lastOps || '无'}</span>
                    <span>{record.lastPackTime}</span>
                  </div>
                )
              }
            }
          ]}
        ></ATable>
      </div>
    </div>
  )
}

export default Main
