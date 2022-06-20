import { Button, Form, Input, message, Radio } from 'antd'
import React from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ChannelDataRow } from '../../channel/common'

type Props = {
  channelList: ChannelDataRow[]
  state: State
  editSuccess: Function
}

type FormType = {
  configName: string
  channelId: string
}

const SetChannel = ({ channelList, state, editSuccess }: Props) => {
  const { currentGame } = state
  const [loading, setLoading] = React.useState<boolean>(false)
  const [form] = Form.useForm<FormType>()
  const submitHandler = async (val: FormType) => {
    const requestData = {
      appId: currentGame,
      ...val
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
      <div className='full-width scroll-bar' style={{ maxHeight: '40vh' }}>
        <Form form={form} colon labelCol={{ span: 2 }} onFinish={val => submitHandler(val)}>
          <Form.Item label="配置名称" name="configName" rules={[{ required: true, message: '配置名称不能为空' }]}>
            <Input maxLength={20} showCount></Input>
          </Form.Item>
          <Form.Item label="渠道" name="channelId" rules={[{ required: true, message: '请选择渠道' }]}>
            <Radio.Group>
              {
                channelList.map(item => <Radio key={item.id} value={item.id} >{item.channelName}</Radio>)
              }
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <div className='full-width flex-row flex-jst-end flex-ali-center pa-col-md'>
              <Button type='primary' htmlType='submit' loading={loading}>提交</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default SetChannel
