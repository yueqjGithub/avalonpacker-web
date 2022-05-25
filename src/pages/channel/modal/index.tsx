import React, { Fragment, useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Checkbox, Divider, Form, Input, message } from 'antd'
import { ChannelDataRow } from '../common'
import { MinusCircleOutlined } from '@ant-design/icons'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { ApiIdForSDK } from '../../../service/urls'
import { Editor } from '@tinymce/tinymce-react'

type Props = {
  state: State
  dispatch: any
  target: ChannelDataRow | undefined
  editSuccess: Function
  isEdit: boolean
}

const apiId: ApiIdForSDK = 'channel'

const EditModule = ({ target, state, dispatch, editSuccess, isEdit }: Props) => {
  const [form] = Form.useForm<ChannelDataRow>()
  const [loading, setLoading] = useState<boolean>(false)
  const editorRef = useRef<any>()
  const optionsList = [
    { value: 'serverConfigDoc', label: '服务端配置' },
    { value: 'clientConfigDoc', label: '客户端配置' },
    { value: 'extra', label: '额外配置' }
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

  const editFinshi = async (val: ChannelDataRow) => {
    const reset = {}
    // console.log(editorRef.current.getContent())
    optionsList.forEach(item => {
      reset[item.value] = val[item.value] ? JSON.stringify(val[item.value]) : ''
    })
    const copy = Object.assign({}, val, reset)
    copy.description = editorRef.current.getContent()
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
      <h3>{target ? '修改' : '新增'}渠道配置</h3>
      <Form<ChannelDataRow> form={form} colon={true} labelAlign='right' labelCol={{ span: 2 }} wrapperCol={{ span: 21 }} onFinish={val => editFinshi(val)}>
        <div className='scroll-bar full-width' style={{ maxHeight: '70vh', marginBottom: 15 }}>
          <Form.Item label='渠道名称' name='channelName' rules={[{ required: true, message: '渠道名称不能为空' }]}>
            <Input disabled={!isEdit}></Input>
          </Form.Item>
          <Form.Item label='渠道CODE' name='channelCode' rules={[{ required: true, message: '渠道CODE不能为空' }]}>
            <Input disabled={!isEdit}></Input>
          </Form.Item>
          <Form.Item label='渠道描述'>
            <Editor
              disabled={!isEdit}
              onInit={(evt, editor) => {
                editorRef.current = editor
              }}
              tinymceScriptSrc={'/tinymce/tinymce/js/tinymce/tinymce.min.js'}
              apiKey='sol86u4tcba6ch9iskfd77wwhr8a0xakxncfts9w6qsoddcw'
              initialValue={target?.description}
              init={{
                language_url: '/tinymce/tinymce/langs/zh_CN.js',
                language: 'zh_CN',
                height: 500,
                menubar: false,
                fontsize_formats: '11px 12px 14px 16px 18px 24px 36px 48px',
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code wordcount'
                ],
                toolbar: 'undo redo | formatselect | fontsizeselect | ' +
                'bold italic forecolor backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'link | removeformat',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </Form.Item>
          <Divider></Divider>
          <Alert message="以下配置将会影响打包界面中，”基础配置”中的可配置属性" type="warning" showIcon></Alert>
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
                                      help={'填写打包时传递给脚本的属性key'}
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
