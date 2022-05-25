import { Button, Modal, Spin } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { State } from '../../store/state'
import { ApiIdForSDK } from '../../service/urls'
import { httpWithStore } from '../../service/axios'
import { CloseCircleFilled, FileTextOutlined } from '@ant-design/icons'
import { ATable } from 'avalon-antd-util-client'
import { getApiDataState } from 'avalon-iam-util-client'
import { RecordDataRow } from './common'
import SearchBar from '../../components/searchBar'
import moment, { Moment } from 'moment'
import { AppDataRow } from '../setgame/common'
import { ChannelDataRow } from '../channel/common'
import Detail from './detail'
import dayjs from 'dayjs'
type Props = {
  state: State
  dispatch: any
}

type QueryOptions = {
  appId: string
  page: number
  pageSize: number
  range: {
    start: string
    end: string
  }
}
type DataSource = {
  total: number
  records: RecordDataRow[]
}
const apiId: ApiIdForSDK = 'queryhistory'

const Main = ({ state, dispatch }: Props) => {
  const { currentGame } = state
  const [loadStatus, setStatus] = useState<'loading' | 'resolve' | 'reject'>('resolve')
  const { data } = getApiDataState<DataSource>({ apiId, state })
  const [showDetail, setShowDetail] = useState<boolean>(false)
  const [target, setTarget] = useState<RecordDataRow>()
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  const { data: channelList = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const page = React.useRef<number>(1)
  const pageSize = React.useRef<number>(10)
  const end = React.useRef<Moment>(moment())
  const start = React.useRef<Moment>(moment().subtract(7, 'day'))
  const cancelObj = useRef({})
  const requestHandler = async (cancelPayload: any = {}) => {
    const requestData: QueryOptions = {
      appId: currentGame,
      page: page.current,
      pageSize: pageSize.current,
      range: {
        start: start.current.hour(0).minute(0).second(0).format('YYYY-MM-DDTHH:mm:ss'),
        end: end.current.hour(23).minute(59).second(59).format('YYYY-MM-DDTHH:mm:ss')
      }
    }
    try {
      setStatus('loading')
      const suc = await httpWithStore({
        data: requestData,
        state,
        apiId,
        dispatch,
        method: 'POST',
        force: true,
        cancelPayload: cancelObj.current
      })
      if (suc) {
        setStatus('resolve')
      } else {
        setStatus('reject')
      }
    } catch {
      setStatus('reject')
    }
  }
  const doSearch = (dateList: { range: [Moment, Moment] }) => {
    start.current = dateList.range[0] || ''
    end.current = dateList.range[1] || ''
    requestHandler()
  }
  useEffect(() => {
    requestHandler(cancelObj.current)
    return () => {
      for (const k in cancelObj.current) {
        if (cancelObj.current[k]) {
          cancelObj.current[k].cancel()
        }
      }
    }
  }, [page, pageSize])
  return (
    <div className={loadStatus === 'loading' ? 'full-width full-height flex-row flex-1 flex-jst-center flex-ali-start' : 'full-width'}>
      {
        loadStatus === 'reject'
          ? (
          <div className='full-width full-height flex-col flex-jst-center flex-ali-center'>
            <CloseCircleFilled style={{ color: '#ff0000', fontSize: '44px', marginBottom: '10px' }}/>
            <span>加载失败</span>
            <Button onClick={() => requestHandler()}>重新请求</Button>
          </div>
            )
          : (
          <div className='full-width'>
            <Spin spinning={loadStatus === 'loading'} style={{ width: '100%' }}>
            <ATable
            loading={loadStatus === 'loading'}
            dataSource={data?.records}
            pagination={{
              current: page.current,
              pageSize: pageSize.current,
              showTotal: total => `共${total}条`,
              total: data?.total,
              onChange: (pageNum, size) => {
                page.current = pageNum
                pageSize.current = size!
                requestHandler()
              }
            }}
            title={() => {
              return (
                <div className="full-width flex-row flex-jst-start flex-ali-center">
                  <SearchBar
                    hideReset={true}
                    searchOptions={[
                      {
                        type: 'timerange',
                        label: '',
                        keyName: 'range',
                        placeholder: '',
                        defaultValue: [start.current, end.current],
                        format: 'YYYY/MM/DD'
                      }
                    ]}
                    onSearch={searchOpt => doSearch(searchOpt)}
                  />
                </div>
              )
            }}
            columns={[
              { dataIndex: 'app', title: '游戏项目', filterDropdown: false, render: val => <span>{gameList.find((item: AppDataRow) => item.appId === val)!.appName}</span> },
              { dataIndex: 'createTime', filterDropdown: false, title: '打包时间', render: val => <span>{val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''}</span> },
              { dataIndex: 'channelCode', title: '渠道', filterDropdown: false, render: val => <span>{channelList.find((item: ChannelDataRow) => item.channelCode === val)!.channelName}</span> },
              { dataIndex: 'channelVersion', filterDropdown: false, title: '渠道版本' },
              { dataIndex: 'supersdkVersion', filterDropdown: false, title: 'SuperSDK版本' },
              { dataIndex: 'motherShortName', filterDropdown: false, title: '母包' },
              {
                title: '详情',
                sorter: undefined,
                filterDropdown: false,
                render: record => {
                  return (
                    <Button type='text' icon={<FileTextOutlined style={{ color: '#1890ff' }} onClick={() => {
                      setTarget(record)
                      setShowDetail(true)
                    }}/>}></Button>
                  )
                }
              }
            ]}
            ></ATable>
          </Spin>
          <Modal title='' footer={false} destroyOnClose width={'55vw'} visible={showDetail} maskClosable={false} onCancel={() => setShowDetail(false)}>
            <Detail target={target} state={state} />
          </Modal>
        </div>
            )
      }
    </div>
  )
}

export default Main