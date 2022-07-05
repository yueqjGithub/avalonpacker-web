import React, { Fragment, useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, Divider, Form, Input, message, Select } from 'antd'
import { PluginsDataRow, PluginTypeItem } from '../common'
import { MinusCircleOutlined } from '@ant-design/icons'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ApiIdForSDK } from '../../../service/urls'
import { getApiDataState } from 'avalon-iam-util-client'

type Props = {
  state: State
  dispatch: any
  target: PluginsDataRow | undefined
  editSuccess: Function
  isEdit: boolean
}

const apiId: ApiIdForSDK = 'plugins'

const EditModule = ({ target, state, dispatch, editSuccess, isEdit }: Props) => {
  const { data: types = [] } = getApiDataState<PluginTypeItem[]>({ apiId: 'pluginstypes', state })
  const [form] = Form.useForm<PluginsDataRow>()
  const [loading, setLoading] = useState<boolean>(false)
  const optionsList = [
    { value: 'extra', label: '插件参数' }
  ]
  useEffect(() => {
    if (target) {
      const reset = {}
      optionsList.forEach(item => {
        reset[item.value] = target[item.value] === '' ? '' : JSON.parse(target[item.value])
      })
      const copy = Object.assign({}, target, reset)
      form.setFieldsValue(copy)
    }
  }, [target])

  const editFinshi = async (val: PluginsDataRow) => {
    const reset = {}
    optionsList.forEach(item => {
      reset[item.value] = val[item.value] ? JSON.stringify(val[item.value]) : ''
    })
    const copy = Object.assign({}, val, reset)
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
      <h3>{target ? '修改' : '新增'}插件配置</h3>
      <Form<PluginsDataRow> form={form} colon={true} labelAlign='right' labelCol={{ span: 2 }} wrapperCol={{ span: 21 }} onFinish={val => editFinshi(val)}>
        <div className='scroll-bar full-width' style={{ maxHeight: '70vh', marginBottom: 15 }}>
          <Form.Item label='插件名称' name='name' rules={[{ required: true, message: '名称不能为空' }]}>
            <Input disabled={!isEdit}></Input>
          </Form.Item>
          <Form.Item label='CODE' name='code' rules={[{ required: true, message: 'CODE不能为空' }]}>
            <Input disabled={!isEdit || target !== undefined}></Input>
          </Form.Item>
          <Form.Item label='插件类型' name='type'>
            <Select disabled={!isEdit}>
              {
                types.map(item => <Select.Option key={item.type} value={item.type}>{item.typeName}</Select.Option>)
              }
            </Select>
          </Form.Item>
          <Form.Item label='插件描述' name='description' help='请输入50字以内的描述性文字'>
            <Input maxLength={50} disabled={!isEdit}></Input>
          </Form.Item>
          <Divider></Divider>
          <Alert message="以下配置将会影响配置界面中，”插件参数”中的可配置属性" type="warning" showIcon></Alert>
          {
            optionsList.map(l => {
              return (
                <Card size="small" title={l.label} style={{ width: '100%', marginTop: 20 }} key={l.value}>
                  <Form.List name={l.value} key={l.value}>
                    {(fields, {
                      add,
                      remove
                    }) => {
                      return (
                        <>
                          {fields.map(({
                            key,
                            name,
                            fieldKey,
                            ...restField
                          }) => {
                            return (
                              <Fragment key={key}>
                                <div className='flex-row flex-jst-start flex-ali-base'>
                                  <div className='flex-row flex-jst-btw flex-ali-center flex-1'>
                                  <Form.Item
                                      {...restField}
                                      style={{ width: '40%' }}
                                      name={[name, 'keyName']}
                                      wrapperCol={{ span: 22 }}
                                      fieldKey={[fieldKey, 'keyName']}
                                      help={'填写分包时传递给脚本的属性key'}
                                      rules={[{
                                        required: true,
                                        message: '属性key值不能为空'
                                      }]}
                                    >
                                      <Input placeholder="填写属性key值" disabled={!isEdit} />
                                    </Form.Item>
                                    <Form.Item
                                      {...restField}
                                      style={{ width: '40%' }}
                                      name={[name, 'label']}
                                      fieldKey={[fieldKey, 'label']}
                                      help={'填写展示在出包工具界面中，对用户的提示性语句'}
                                      wrapperCol={{ span: 22 }}
                                    >
                                      <Input placeholder="填写属性描述" disabled={!isEdit} />
                                    </Form.Item>
                                    <Form.Item
                                      {...restField}
                                      style={{ width: '15%' }}
                                      name={[name, 'required']}
                                      fieldKey={[fieldKey, 'required']}
                                      valuePropName='checked'
                                    >
                                      <Checkbox>必填</Checkbox>
                                    </Form.Item>
                                  </div>
                                  {
                                    isEdit ? (<MinusCircleOutlined onClick={() => remove(name)} style={{ marginLeft: 5 }} />) : ''
                                  }
                                </div>
                              </Fragment>
                            )
                          })}
                          <Form.Item wrapperCol={{ span: 24 }}>
                            <div className='full-width flex-row flex-jst-center flex-ali-center'>
                              {
                                isEdit
                                  ? (
                                  <Button type="primary" ghost onClick={() => add()} block style={{ maxWidth: '300px' }}>
                                    {`增加${l.label}`}
                                  </Button>
                                    )
                                  : ''
                              }
                            </div>
                          </Form.Item>
                        </>
                      )
                    }}
                  </Form.List>
                </Card>
              )
            })
          }
        </div>
        <Form.Item wrapperCol={{ span: 23 }}>
          <div className='flex-row flex-jst-end flex-ali-center'>
            {
              isEdit ? (<Button type="primary" htmlType="submit" loading={loading}>提交</Button>) : ''
            }
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default EditModule
