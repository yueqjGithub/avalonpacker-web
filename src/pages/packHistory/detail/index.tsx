import { Button, Descriptions, message, Spin, Table } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useMemo, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ChannelDataRow } from '../../channel/common'
import { AppDataRow } from '../../setgame/common'
import dayjs from 'dayjs'
import { PluginsDataRow } from '../../plugins/common'
import { MediaFlagDataRow } from '../../mediaFlag/common'
import { RecordDataRow } from '../../packerRecord/common'
import styles from '../common/hisStyle.module.scss'
import { copyHandler } from '../../../utils/utils'
import QRCode from 'qrcode.react'
type Props = {
  state: State
  target?: string // id
  isFromConfig?: boolean
}

const Detail = ({ target, state, isFromConfig = false }: Props) => {
  const { isMac, publicTypes } = state
  const [loading, setLoading] = useState<boolean>(false)
  const [detail, setDetail] = useState<any>()
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  // iam
  const { data: iamusers = [] } = getApiDataState<IamUserType[]>({ apiId: 'iamuserlist', state })
  const { data: channelList = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const { data: mediaList = [] } = getApiDataState<MediaFlagDataRow[]>({ apiId: 'mediaflag', state })
  const { data: configList = [] } = getApiDataState<RecordDataRow[]>({ apiId: 'packrecord', state })
  const queryDetail = async () => {
    try {
      setLoading(true)
      const { data } = await httpApi({
        state,
        apiId: 'historydetail',
        method: 'POST',
        httpCustomConfig: isFromConfig
          ? {
              headers: {
                dependPath: '/packer/admin/packerRecord/package',
                dependAction: encodeURIComponent('分包')
              }
            }
          : {},
        data: { ids: [target] }
      }).request
      setDetail(data.data[0])
    } catch {
      message.error('请求详情出错')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    queryDetail()
  }, [])
  const showUpload = useMemo(() => {
    if (detail) {
      return isMac && detail.mediaFinishedPackagesList?.find(item => item.publicType === 1) !== undefined
    } else {
      return false
    }
  }, [detail])
  const dynamicColumn = useMemo(() => {
    const result: any[] = []
    if (isMac) {
      result.push({
        title: '发布方式',
        sorter: undefined,
        filterDropdown: false,
        align: 'center',
        dataIndex: 'publicType',
        render: val => <span>{publicTypes.find(item => item.val === val)?.name || '未知'}</span>
      })
    }
    if (showUpload) {
      result.push({
        title: '上传APPSTORE',
        sorter: undefined,
        filterDropdown: false,
        align: 'center',
        render: record => {
          return (
            <Button size="small" type="primary">上传APPSTORE</Button>
          )
        }
      })
    }
    return result
  }, [isMac, showUpload])
  return (
    <div className='full-width'>
      <Spin spinning={loading}>
        <div className='full-width scroll-bar' style={{ maxHeight: '70vh' }}>
          <div className={styles.detailTit}>母包信息</div>
          <Descriptions title="" bordered>
            <Descriptions.Item label="游戏项目">{gameList.find((item: AppDataRow) => item.appId === detail?.app)?.appName || ''}</Descriptions.Item>
            <Descriptions.Item label='superSDK版本'>{detail?.supersdkVersion}</Descriptions.Item>
          </Descriptions>
          <div className={styles.detailTit}>分包信息</div>
          <Descriptions title="" bordered column={3}>
            <Descriptions.Item label='渠道'>{channelList.find((item: ChannelDataRow) => item.channelCode === detail?.channelCode)?.channelName || ''}</Descriptions.Item>
            <Descriptions.Item label='分包配置'>{configList.find(item => item.id === detail?.configId)?.configName || ''}</Descriptions.Item>
            <Descriptions.Item label={ isMac ? 'bundle id' : '包名' }>{detail?.packageName}</Descriptions.Item>
            <Descriptions.Item label='分包环境'>{detail?.envDesc}</Descriptions.Item>
            <Descriptions.Item label='渠道版本'>{detail?.channelVersion}</Descriptions.Item>
            <Descriptions.Item label='分包时间'>{dayjs(detail?.createTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label='操作人'>{iamusers.find(item => item.id === Number(detail?.opsUser))?.name || detail?.opsUser}</Descriptions.Item>
          </Descriptions>
          <div className={styles.detailTit}>插件列表</div>
          <Table rowKey='code' style={{ width: '35%' }} size='small' bordered dataSource={(detail?.pluginsList as PluginsDataRow[]) || []}
          pagination={false}
          columns={[
            { dataIndex: 'name', title: '插件名' },
            { dataIndex: 'code', title: 'code' }
          ]}
          ></Table>
          <div className={styles.detailTit}>媒体标识与成品包</div>
          <Table rowKey='id' size='small' bordered dataSource={detail?.mediaFinishedPackagesList || []}
            style={{ width: '100%' }}
            pagination={false}
            columns={[
              {
                dataIndex: 'configId',
                title: '分包配置',
                render: val => {
                  return <span>{configList.find(item => item.id === detail?.configId)?.configName || ''}</span>
                }
              },
              { dataIndex: 'mediaName', align: 'center', title: '媒体标识', render: val => <span>{mediaList.find(item => item.code === val)?.mediaName || 'default'}</span> },
              { dataIndex: 'packageName', align: 'center', title: '成品包' },
              {
                dataIndex: 'downUrl',
                width: 80,
                align: 'center',
                title: '下载',
                render: (val, record) => {
                  const targetUrl = `${detail.downloadHost}${val}`
                  return (
                    <div className='full-width flex-col flex-jst-center flex-ali-center'>
                      <Button type="primary" size="small" href={targetUrl}>下载</Button>
                      <Button
                      onClick={() => {
                        copyHandler(targetUrl)?.then(() => message.success('已复制'), () => message.error('复制失败'))
                      }}
                      size="small"
                      type="primary"
                      className='ma-col-sm'
                      >
                        复制下载链接
                      </Button>
                    </div>
                  )
                }
              },
              {
                title: '二维码下载',
                sorter: undefined,
                filterDropdown: false,
                align: 'center',
                render: record => {
                  const targetUrl = `${detail.downloadHost}${record.downUrl}`
                  return (
                    <QRCode
                      width={200}
                      value={targetUrl}
                    ></QRCode>
                  )
                }
              },
              ...dynamicColumn
            ]}
            ></Table>
        </div>
      </Spin>
    </div>
  )
}

export default Detail
