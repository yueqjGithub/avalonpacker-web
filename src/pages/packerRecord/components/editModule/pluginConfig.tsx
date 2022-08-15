import { Card, Form, Input, notification } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useEffect, useState } from 'react'
import { State } from '../../../../store/state'
import { PluginsDataRow } from '../../../plugins/common'
import { RecordDataRow } from '../../common'

type Props = {
  state: State
  target: RecordDataRow
  submitSymbol: boolean | undefined
  submitVal: Function
  clearCount: Function
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

const PluginsConfig = ({ target, state, submitSymbol, submitVal, clearCount }: Props) => {
  const { data: pluginList = [] } = getApiDataState<PluginsDataRow[]>({ apiId: 'plugins', state })
  const targetList = target.pluginsList?.split(',') || []
  const [optionsList, setOptions] = useState<any[]>([])
  const [form] = Form.useForm()
  const validForm = async () => {
    if (submitSymbol !== undefined) {
      try {
        await form.validateFields()
        const formResult = form.getFieldsValue()
        const result = {}
        for (const k in formResult) {
          result[k] = {}
          formResult[k].forEach(ele => {
            result[k][ele.keyName] = ele.value
          })
        }
        submitVal({ keyname: 'pluginsConfig', val: JSON.stringify(result), add: true })
      } catch {
        clearCount()
        notification.warning({
          message: '参数缺失提示',
          description: '插件参数未配置完整'
        })
      }
    }
  }
  useEffect(() => {
    validForm()
  }, [submitSymbol])
  useEffect(() => {
    const configList = pluginList.filter(item => targetList.includes(item.id!))
    const list: any[] = []
    configList.forEach(item => {
      if (item.extra) {
        const settings = dealOptions(item.extra)
        if (target.pluginsConfig && target.pluginsConfig !== '{}' && target.pluginsConfig !== '') {
          const already = JSON.parse(target.pluginsConfig)
          settings.forEach(ele => {
            try {
              ele.value = already[item.code][ele.keyName]
            } catch {
              ele.value = ''
            }
          })
        }
        list.push({ label: item.name, settings, keyName: item.code })
      }
    })
    setOptions(list)
    const reset = {}
    list.forEach(item => {
      reset[item.keyName] = item.settings
    })
    form.setFieldsValue(reset)
  }, [target])

  return (
    <div className='full-width'>
      <Form form={form} wrapperCol={{ span: 20 }} labelCol={{ span: 3 }} labelWrap>
        <div className='scroll-bar' style={{ maxHeight: '70vh' }}>
        {
          optionsList!.map(item => {
            return (
              <Card key={item.keyName} size="small" title={item.label} style={{ width: '100%', marginTop: 20 }}>
                <Form.List name={item.keyName}>
                  {
                    (fields) => {
                      return (
                        <>
                          {
                            fields.map(({ key, name, fieldKey, ...restField }) => {
                              return (
                                <div className='full-width pa-row-sm' key={key}>
                                  <Form.Item normalize={val => val.trim()}
                                    {...restField}
                                    name={[name, 'value']}
                                    label={item.settings[key].keyName}
                                    help={item.settings[key].label}
                                    required={item.settings[key].required}
                                    rules={[{ required: item.settings[key].required, message: `${item.settings[key].keyName}不能为空` }]}
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
            )
          })
        }
        </div>
      </Form>
    </div>
  )
}

export default PluginsConfig
