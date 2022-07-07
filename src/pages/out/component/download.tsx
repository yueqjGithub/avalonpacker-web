import { Button, message } from 'antd'
import { ATable } from 'avalon-antd-util-client'
import React, { useMemo } from 'react'
import { copyHandler } from '../../../utils/utils'
import { RecordDataRow } from '../../packerRecord/common'
import { ChannelMediaPackage, HistoryDetailVo } from '../common'
import QRCode from 'qrcode.react'

type Props = {
  historyList: HistoryDetailVo[]
  configList: RecordDataRow[]
}

type DataRowType = ChannelMediaPackage & {
  configName?: string
  downloadHost?: string
  updateTime?: string
}

const DownloadModal = ({ historyList, configList }: Props) => {
  const fileList = useMemo(() => {
    const result: DataRowType[] = []
    historyList.forEach(item => {
      const targetConfig = configList.find(conf => item.configId === conf.id)
      item.mediaFinishedPackagesList.forEach(m => {
        result.push({
          ...m,
          downloadHost: item.downloadHost,
          configName: targetConfig?.configName,
          updateTime: targetConfig?.updateTime
        })
      })
    })
    return result
  }, [historyList, configList])
  return (
    <div className='full-width'>
      <ATable
        dataSource={fileList}
        columns={[
          {
            title: '分包配置',
            align: 'center',
            sorter: undefined,
            filterDropdown: false,
            render: record => {
              return (
                <div className='flex-col flex-jst-center flex-align-center'>
                  <p>{record.configName}</p>
                  <p>{record.updateTime}</p>
                </div>
              )
            }
          },
          {
            title: '媒体标识',
            align: 'center',
            sorter: undefined,
            filterDropdown: false,
            dataIndex: 'mediaName'
          },
          {
            title: '成品包',
            align: 'center',
            width: 400,
            sorter: undefined,
            filterDropdown: false,
            dataIndex: 'packageName'
          },
          {
            title: '下载',
            dataIndex: 'downUrl',
            align: 'center',
            sorter: undefined,
            filterDropdown: false,
            render: (val, record) => {
              const targetUrl = `${record.downloadHost}${val}`
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
              const targetUrl = `${record.downloadHost}${record.downUrl}`
              return (
                <QRCode
                  width={200}
                  value={targetUrl}
                ></QRCode>
              )
            }
          }
        ]}
      ></ATable>
    </div>
  )
}

export default DownloadModal
