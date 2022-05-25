import React, { useEffect, useState } from 'react'
import { Button, Divider, Form, Input, message } from 'antd'
import { MediaFlagDataRow } from '../common'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ApiIdForSDK } from '../../../service/urls'

type Props = {
  state: State
  dispatch: any
  target: MediaFlagDataRow | undefined
  editSuccess: Function
}

const apiId: ApiIdForSDK = 'mediaflag'

const EditModule = ({ target, state, editSuccess }: Props) => {
  const [form] = Form.useForm<MediaFlagDataRow>()
  const [loading, setLoading] = useState<boolean>(false)
  useEffect(() => {
    if (target) {
      form.setFieldsValue(target)
    }
  }, [target])

  const editFinshi = async (val: MediaFlagDataRow) => {
    const copy = Object.assign({}, val)
    if (target) {
      copy.id = target.id
    }
    setLoading(true)
    try {
      const { data } = await httpApi({
        state,
        apiId,
        method: 'POST',
        data: copy,
        httpCustomConfig: {
          headers: {
            actionName: encodeURIComponent(target ? '更新' : '新增')
          }
        }
      }).request
      if (data.status === 0) {
        message.success('提交成功')
        editSuccess()
      } else {
        message.error(data.message)
      }
    } catch {
      message.error('程序出错')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='full-width'>
      <h3>{target ? '修改' : '新增'}媒体标识</h3>
      <Form<MediaFlagDataRow> form={form} colon={true} labelAlign='right' labelCol={{ span: 2 }} wrapperCol={{ span: 21 }} onFinish={val => editFinshi(val)}>
        <div className='scroll-bar full-width' style={{ maxHeight: '70vh', marginBottom: 15 }}>
          <Form.Item label='ID' name='code' rules={[{ required: true, message: 'CODE不能为空' }]}>
            <Input></Input>
          </Form.Item>
          <Form.Item label='媒体标识名称' name='mediaName' rules={[{ required: true, message: '媒体标识名称不能为空' }]}>
            <Input></Input>
          </Form.Item>
          <Form.Item label='备注' name='description' help='输入20字以内的备注信息'>
            <Input maxLength={20}></Input>
          </Form.Item>
          <Divider></Divider>
        </div>
        <Form.Item wrapperCol={{ span: 23 }}>
          <div className='flex-row flex-jst-end flex-ali-center'>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default EditModule
