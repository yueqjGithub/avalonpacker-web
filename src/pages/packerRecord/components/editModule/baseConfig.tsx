import { Card, Divider, Form, Input, notification, Select } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect } from 'react'
import { State } from '../../../../store/state'
import { ChannelDataRow } from '../../../channel/common'
import { RecordDataRow } from '../../common'

type Props = {
  state: State
  target: RecordDataRow
  submitSymbol: boolean | undefined
  submitVal: Function
  clearCount: Function
  channelSourceList: string[]
}

const dealOptions = (str: string | undefined) => {
  if (!str) {
    return []
  } else {
    const obj = JSON.parse(str)
    const result: any[] = []
    obj.forEach(item => {
      result.push({ keyName: item.keyName, label: item.label, value: '', required: item.required })
    })
    return result
  }
}

const BaseConfig = ({ target, state, submitSymbol, submitVal, clearCount, channelSourceList }: Props) => {
  const { isMac, publicTypes } = state
  const { data: channelList = [] } = getApiDataState<ChannelDataRow[]>({ apiId: 'channel', state })
  const targetChannel = channelList.find(item => item.id === target.channelId)
  const [form] = Form.useForm()
  const validForm = async () => {
    if (submitSymbol !== undefined) {
      try {
        await form.validateFields()
        const formResult = form.getFieldsValue()
        const result = {}
        for (const k in formResult) {
          if (k !== 'channelVersion' && k !== 'publicType') {
            result[k] = {}
            formResult[k].forEach(ele => {
              result[k][ele.keyName] = ele.value
            })
          }
        }
        submitVal({ keyname: 'channelVersion', val: formResult.channelVersion })
        submitVal({ keyname: 'publicType', val: formResult.publicType })
        submitVal({ keyname: 'baseConfig', val: JSON.stringify(result), add: true })
      } catch (e) {
        console.log(e)
        clearCount()
        notification.warning({
          message: '参数缺失提示',
          description: '渠道参数未配置完整'
        })
      }
    }
  }
  useEffect(() => {
    validForm()
  }, [submitSymbol])
  const obj = {
    serverConfigDoc: dealOptions(targetChannel?.serverConfigDoc),
    clientConfigDoc: dealOptions(targetChannel?.clientConfigDoc),
    extra: dealOptions(targetChannel?.extra)
  }
  useEffect(() => {
    if (target.baseConfig) {
      const config = JSON.parse(target.baseConfig)
      if (config.serverConfigDoc) {
        obj.serverConfigDoc.forEach(item => {
          item.value = config.serverConfigDoc[item.keyName]
        })
      }
      if (config.clientConfigDoc) {
        obj.clientConfigDoc.forEach(item => {
          item.value = config.clientConfigDoc[item.keyName]
        })
      }
      if (config.extra) {
        obj.extra.forEach(item => {
          item.value = config.extra[item.keyName]
        })
      }
    }
    form.setFieldsValue(obj)
  }, [target])
  return (
    <div className='full-width'>
      <div className='full-width' dangerouslySetInnerHTML={{ __html: targetChannel?.description || '' }}></div>
      <Divider></Divider>
      <Form form={form} wrapperCol={{ span: 18 }} labelCol={{ span: 5 }} labelWrap>
        <Card size='small' title='渠道配置' style={{ width: '100%', marginTop: 20 }}>
          <Form.Item name='channelVersion' label='渠道版本' initialValue={target.channelVersion} rules={[{ required: true, message: '渠道版本必选' }]}>
            <Select>
              {
                channelSourceList.map(item => <Select.Option value={item} key={item}>{item}</Select.Option>)
              }
            </Select>
          </Form.Item>
          {
            isMac && (
              <Form.Item label='发布方式' name='publicType' initialValue={target.publicType} rules={[{ required: true, message: '请选择发布方式' }]}>
                <Select>
                  {
                    publicTypes.map(item => <Select.Option value={item.val} key={item.val}>{item.name}</Select.Option>)
                  }
                </Select>
              </Form.Item>
            )
          }
        </Card>
        <Card size="small" title='客户端配置' style={{ width: '100%', marginTop: 20 }}>
          <Form.List name='clientConfigDoc'>
            {
              (fields) => {
                return (
                  <>
                    {
                      fields.map(({ key, name, fieldKey, ...restField }) => {
                        return (
                          <div className='full-width pa-row-sm' key={key}>
                            <Form.Item
                                {...restField}
                                name={[name, 'value']}
                                label={obj.clientConfigDoc[key].keyName}
                                help={obj.clientConfigDoc[key].label}
                                required={obj.clientConfigDoc[key].required}
                                rules={[{ required: obj.clientConfigDoc[key].required, message: `${obj.clientConfigDoc[key].keyName}不能为空` }]}
                              >
                                <Input placeholder="" />
                              </Form.Item>
                          </div>
                        )
                      })
                    }
                  </>
                )
              }
            }
          </Form.List>
        </Card>
        {
          !isMac && (
            <>
              <Card size="small" title='服务端配置' style={{ width: '100%', marginTop: 20 }}>
          <Form.List name='serverConfigDoc'>
            {
              (fields) => {
                return (
                  <>
                    {
                      fields.map(({ key, name, fieldKey, ...restField }) => {
                        return (
                          <div className='full-width pa-row-sm' key={key}>
                            <Form.Item
                                {...restField}
                                name={[name, 'value']}
                                label={obj.serverConfigDoc[key].keyName}
                                help={obj.serverConfigDoc[key].label}
                                required={obj.serverConfigDoc[key].required}
                                rules={[{ required: obj.serverConfigDoc[key].required, message: `${obj.serverConfigDoc[key].keyName}不能为空` }]}
                              >
                                <Input placeholder="" />
                              </Form.Item>
                          </div>
                        )
                      })
                    }
                  </>
                )
              }
            }
          </Form.List>
        </Card>
        <Card size="small" title='其他配置' style={{ width: '100%', marginTop: 20 }}>
          <Form.List name='extra'>
            {
              (fields) => {
                return (
                  <>
                    {
                      fields.map(({ key, name, fieldKey, ...restField }) => {
                        return (
                          <div className='full-width pa-row-sm' key={key}>
                            <Form.Item
                                {...restField}
                                name={[name, 'value']}
                                label={obj.extra[key].keyName}
                                help={obj.extra[key].label}
                                required={obj.extra[key].required}
                                rules={[{ required: obj.extra[key].required, message: `${obj.extra[key].keyName}不能为空` }]}
                              >
                                <Input placeholder="" />
                              </Form.Item>
                          </div>
                        )
                      })
                    }
                  </>
                )
              }
            }
          </Form.List>
        </Card>
            </>
          )
        }
      </Form>
    </div>
  )
}

export default BaseConfig
