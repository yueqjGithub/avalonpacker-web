import { Button, Form, Input, InputNumber, message, Switch } from 'antd'
import React, { useContext, useEffect, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { ApiIdForSDK } from '../../../service/urls'
import { Context } from '../../../store/context'
import { EnvDataClass } from '../common'

type Props = {
  target?: EnvDataClass
  editSuccess: Function
}
const apiId: ApiIdForSDK = 'envlist'
const EditModal = ({ target, editSuccess }: Props) => {
  const { state } = useContext(Context)
  const [form] = Form.useForm<EnvDataClass>()
  const [loading, setLoading] = useState<boolean>(false)
  useEffect(() => {
    if (target) {
      form.setFieldsValue(target)
    } else {
      form.setFieldsValue(new EnvDataClass())
    }
  }, [target])
  const requestHandler = async (val: EnvDataClass) => {
    const requestData = { ...val }
    try {
      setLoading(true)
      const { data } = await httpApi({
        apiId,
        state,
        data: requestData,
        method: target ? 'PUT' : 'POST',
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
    } catch (e: any) {
      if (e.message) {
        message.error(e.message)
      } else {
        message.error('程序出错')
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='full-width'>
      <h3>{target ? '修改' : '新增'}环境变量</h3>
      <Form<EnvDataClass> form={form} colon={true} labelAlign='right' labelCol={{ span: 2 }} wrapperCol={{ span: 21 }} onFinish={val => requestHandler(val)}>
        <Form.Item label='环境名称' name='envDesc' help='请按 国（内/外）-（内/外）网（环境名）环境 格式进行填写' rules={[{ required: true }]}>
          <Input></Input>
        </Form.Item>
        <Form.Item label='CODE' name='envCode' rules={[{ required: true }]}>
          <Input disabled={target !== undefined}></Input>
        </Form.Item>
        <Form.Item label='supersdkUrl' name='supersdkUrl' rules={[{ required: true }]}>
          <Input></Input>
        </Form.Item>
        <Form.Item label='avalonsdkUrl' name='avalonsdkUrl' rules={[{ required: true }]}>
          <Input></Input>
        </Form.Item>
        <Form.Item label='启用状态' name='enable' rules={[{ required: true }]}>
          <Switch defaultChecked={target?.enable}></Switch>
        </Form.Item>
        <Form.Item label='排序值' name='sortNum' rules={[{ required: true }]}>
          <InputNumber min={0} step={1} ></InputNumber>
        </Form.Item>
        <Form.Item wrapperCol={{ span: 23 }}>
          <div className='flex-row flex-jst-end flex-ali-center'>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default EditModal
