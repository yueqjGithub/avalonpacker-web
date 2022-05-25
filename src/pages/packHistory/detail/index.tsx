import { Descriptions, message, Spin, Table } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ChannelDataRow } from '../../channel/common'
import { AppDataRow } from '../../setgame/common'
import { RecordDataRow } from '../common'
import dayjs from 'dayjs'
import { PluginsDataRow } from '../../plugins/common'
import { MediaFlagDataRow } from '../../mediaFlag/common'
type Props = {
  state: State
  target: RecordDataRow | undefined
}

const Detail = ({ target, state }: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [detail, setDetail] = useState<any>()
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  const { data: channelList = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const { data: mediaList = [] } = getApiDataState<MediaFlagDataRow[]>({ apiId: 'mediaflag', state })
  const queryDetail = async () => {
    try {
      setLoading(true)
      const { data } = await httpApi({
        state,
        apiId: 'historydetail',
        targetId: target?.id
      }).request
      setDetail(data.data)
    } catch {
      message.error('请求详情出错')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    queryDetail()
  }, [])
  return (
    <div className='full-width'>
      <Spin spinning={loading}>
        <div className='full-width scroll-bar' style={{ maxHeight: '70vh' }}>
          <Descriptions title={<></>} column={2} labelStyle={{ width: 140, display: 'flex', justifyContent: 'flex-end', color: 'grey' }}>
            <Descriptions.Item label='游戏项目' span={2}>{gameList.find((item: AppDataRow) => item.appId === target?.app)?.appName || ''}</Descriptions.Item>
            <Descriptions.Item label='渠道'>{channelList.find((item: ChannelDataRow) => item.channelCode === target?.channelCode)?.channelName || ''}</Descriptions.Item>
            <Descriptions.Item label='渠道版本'>{target?.channelVersion}</Descriptions.Item>
            <Descriptions.Item label='母包'>{target?.motherName}</Descriptions.Item>
            <Descriptions.Item label='superSDK版本'>{target?.supersdkVersion}</Descriptions.Item>
            <Descriptions.Item label='包名' span={2}>{target?.packageName}</Descriptions.Item>
            <Descriptions.Item label='打包时间' span={2}>{dayjs(target?.createTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label='插件列表' span={2}>
              <Table rowKey='code' size='small' bordered dataSource={(detail?.pluginsList as PluginsDataRow[]) || []}
              pagination={false}
              columns={[
                { dataIndex: 'name', title: '插件名' },
                { dataIndex: 'code', title: 'code' }
              ]}
              ></Table>
            </Descriptions.Item>
            <Descriptions.Item label='媒体标识与成品包' span={2}>
            <Table rowKey='id' size='small' bordered dataSource={detail?.mediaFinishedPackagesList || []}
              style={{ width: '100%' }}
              pagination={false}
              columns={[
                { dataIndex: 'mediaName', title: '媒体标识名称', render: val => <span>{mediaList.find(item => item.code === val)?.mediaName || 'default'}</span> },
                { dataIndex: 'packageName', title: '成品包' },
                {
                  dataIndex: 'downUrl',
                  width: 80,
                  title: '下载',
                  render: (val, record) => {
                    const downloadUrl = `${detail.downloadHost}${val}`
                    return (
                      <div className='flex-row flex-jst-start flex-ali-center'>
                        <a href={downloadUrl} download={record.packageName} target="_blank" rel="noreferrer">下载</a>
                      </div>
                    )
                  }
                }
              ]}
              ></Table>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Spin>
    </div>
  )
}

export default Detail
