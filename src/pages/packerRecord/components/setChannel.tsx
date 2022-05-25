import { Button, Checkbox, Empty, message } from 'antd'
import React from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ChannelDataRow } from '../../channel/common'

type Props = {
  channelList: ChannelDataRow[]
  state: State
  editSuccess: Function
}

const SetChannel = ({ channelList, state, editSuccess }: Props) => {
  const { currentGame } = state
  const [checkedList, setList] = React.useState<any[]>()
  const [loading, setLoading] = React.useState<boolean>(false)
  const submitHandler = async () => {
    const requestData = {
      appId: currentGame,
      channels: checkedList?.join(',')
    }
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId: 'addrecord',
        state,
        method: 'POST',
        data: requestData
      }).request
      if (res.status === 0) {
        message.success('添加完成')
        editSuccess()
      } else {
        message.error(res.message || res.error_message)
      }
    } catch (e) {
      message.error('程序出错')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='full-width'>
      <div className='full-width scroll-bar' style={{ height: '40vh' }}>
        {
          channelList.length > 0
            ? (
              <Checkbox.Group onChange={val => setList(val)}>
                {
                  channelList.map(item => <Checkbox key={item.id} value={item.id} >{item.channelName}</Checkbox>)
                }
              </Checkbox.Group>
              )
            : (
              <Empty description="没有可以使用的渠道了"></Empty>
              )
        }
      </div>
      <div className='full-width flex-row flex-jst-end flex-ali-center pa-col-md'>
        <Button type='primary' onClick={submitHandler} loading={loading}>提交</Button>
      </div>
    </div>
  )
}

export default SetChannel
