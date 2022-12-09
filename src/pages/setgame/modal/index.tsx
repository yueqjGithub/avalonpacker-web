import { Button, Divider, Form, Input, InputNumber, message, Radio, Select } from 'antd'
import React, { ChangeEvent, MutableRefObject, useEffect, useRef, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { ApiIdForSDK } from '../../../service/urls'
import { State } from '../../../store/state'
import { AppDataRow, screenType } from '../common'

type Props = {
  target: AppDataRow | undefined
  state: State
  editSuccess: Function
  permissionList: PermissionList
}

const apiId: ApiIdForSDK = 'gamelist'

const EditModule = ({ target, state, editSuccess, permissionList }: Props) => {
  const { isMac } = state
  const ref: MutableRefObject<any> = useRef(null)
  const [form] = Form.useForm<AppDataRow>()
  const [signList, setList] = useState<string[]>([])
  const [descList, setDescList] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [signLoading, setSignLoading] = useState<boolean>(false)
  const editFinshi = async (val: AppDataRow) => {
    const requestData = {
      ...val
    }
    if (target) {
      requestData.id = target.id
    }
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId,
        method: 'POST',
        state,
        data: requestData,
        httpCustomConfig: {
          headers: {
            actionName: encodeURIComponent(target ? '更新' : '新增')
          }
        }
      }).request
      if (res.status === 0) {
        message.success('设置成功')
        await editSuccess()
      } else {
        message.error(res.message)
      }
      setLoading(false)
    } catch (e) {
      setLoading(false)
      message.error((e as Error).message)
    }
  }
  const querySignPath = async (cancelObj) => {
    const { request, cancel } = httpApi({
      apiId: 'querysignpath',
      state,
      targetId: target?.id
    })
    cancelObj = { ...cancel }
    try {
      setSignLoading(true)
      const { data: res } = await request
      if (res.status === 0) {
        if (isMac) {
          setDescList(res.data.descList)
        } else {
          setList(res.data.signList)
        }
      } else {
        message.error(res.message)
      }
    } catch (e) {
      message.error('获取签名文件失败')
    } finally {
      setSignLoading(false)
    }
  }
  const [uploadType, setUploadType] = useState<4 | 7>(4) // 4-android签名文件ios证书，7-ios描述文件
  const testUpload = (type: 4 | 7) => {
    setUploadType(type)
    ref.current!.click()
  }
  // const uploadHandler = async (e:ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files![0]
  //   splitFile(file, 5).then(res => { console.log(res) })
  // }
  const uploadHandler = async (e:ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : ''
    if (!file) {
      message.error('获取上传信息失败')
      return false
    }
    const fileName = file.name
    const fm = new FormData()
    fm.append('file', file)
    fm.append('type', String(uploadType))
    fm.append('appId', target?.appId!)
    try {
      setLoading(false)
      const { data: res } = await httpApi({
        apiId: 'uploadimg',
        state,
        method: 'POST',
        data: fm,
        httpCustomConfig: {
          headers: {
            actionName: encodeURIComponent('应用签名上传')
          }
        }
      }).request
      if (res.status === 0) {
        const copyList = uploadType === 4 ? [...signList] : [...descList]
        if (copyList.indexOf(fileName) === -1) {
          copyList.push(fileName)
        }
        const cur = form.getFieldsValue()
        if (uploadType === 4) {
          if (isMac) {
            cur.macSignFile = fileName
          } else {
            cur.signFilePath = fileName
          }
          setList(copyList)
        } else {
          cur.descFileName = fileName
          setDescList(copyList)
        }
        form.setFieldsValue(cur)
        message.success('上传成功')
      } else {
        message.error(res.error_msg || res.message)
      }
    } catch (e) {
      message.error('上传出错')
    } finally {
      ref.current.value = ''
      setLoading(false)
    }
  }
  useEffect(() => {
    const cancelObj: any = {}
    if (target) {
      form.setFieldsValue(target)
      querySignPath(cancelObj)
    }
    return () => {
      if (cancelObj.querysignpath) {
        cancelObj.querysignpath.cancel()
      }
    }
  }, [target])
  return (
    <>
      <h3>{target?.appName || '新增应用'}</h3>
      <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/>
      <Form<AppDataRow> layout='vertical' colon={true} form={form} labelAlign='right' onFinish={val => editFinshi(val)}>
        <Form.Item normalize={val => val.trim()} label="APP_ID" name="appId" rules={[{ required: true, message: 'APP_ID不能为空' }]}>
          <Input disabled={target !== undefined}/>
        </Form.Item>
        <Form.Item normalize={val => val.trim()} label="应用名称" name="appName" rules={[{ required: true, message: '应用名称不能为空' }]}>
          <Input />
        </Form.Item>
        <Form.Item normalize={val => val.trim()} label="母包FTP路径" name="motherFtpPaths" rules={[{ required: true, message: '母包FTP路径不能为空' }]} help='多个路径请用英文,隔开，如/dungeonkeeper/cn/client/,/dungeonkeeper/global/client/'>
          <Input />
        </Form.Item>
        <Form.Item label="versionCode" name="versionCode" rules={[{ required: true, message: '请设置versionCode' }]} initialValue={target?.versionCode}>
          <InputNumber min={0} step={1}></InputNumber>
        </Form.Item>
        <Form.Item label="屏幕方向" name="screenOrientation" rules={[{ required: true, message: '请设置屏幕方向' }]}>
          <Radio.Group>
            {
              screenType.map(item => <Radio value={item.val} key={item.val}>{item.label}</Radio>)
            }
          </Radio.Group>
        </Form.Item>
        <Divider></Divider>
        {
          target
            ? (
            <>
              {
                <>
                  <div className='full-width flex-row flex-jst-start flex-ali-center'>
                    <Form.Item
                    className='flex-1'
                    shouldUpdate
                    label={isMac ? 'IOS证书' : 'signFilePath'}
                    name={isMac ? 'macSignFile' : 'signFilePath'}
                    initialValue={isMac ? target?.macSignFile : target?.signFilePath}
                    normalize={val => val === undefined ? null : val}
                    >
                      <Select loading={signLoading} allowClear>
                        {
                          signList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                        }
                      </Select>
                    </Form.Item>
                    {
                      permissionList.upload ? <Button type='primary' style={{ marginTop: 7 }} className='ma-lf-05' onClick={() => testUpload(4)}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button> : ''
                    }
                  </div>
                {
                  isMac
                    ? (
                      <>
                          <div className='flex-row flex-jst-start flex-ali-center'>
                            <Form.Item shouldUpdate className='flex-1' label='IOS描述文件' name='descFileName' initialValue={target?.descFileName} normalize={val => val === undefined ? null : val}>
                              <Select loading={signLoading} allowClear>
                                {
                                  descList && descList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                                }
                              </Select>
                            </Form.Item>
                            {
                              permissionList.upload ? <Button style={{ marginTop: 7 }} type='primary' className='ma-lf-05' onClick={() => testUpload(7)}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button> : ''
                            }
                          </div>
                          <Form.Item normalize={val => val.trim()} label="IOS证书密码" name="macCertPwd" initialValue={target?.macCertPwd}>
                            <Input />
                          </Form.Item>
                      </>
                      )
                    : (
                    <>
                      <Form.Item normalize={val => val.trim()} label="signFileKeystorePassword" name="signFileKeystorePassword" initialValue={target?.signFileKeystorePassword}>
                        <Input />
                      </Form.Item>
                      <Form.Item normalize={val => val.trim()} label="signFileKeyPassword" name="signFileKeyPassword" initialValue={target?.signFileKeyPassword}>
                        <Input />
                      </Form.Item>
                      <Form.Item normalize={val => val.trim()} label="signFileAlias" name="signFileAlias" initialValue={target?.signFileAlias}>
                        <Input />
                      </Form.Item>
                    </>
                      )
                }
              </>
              }
            </>
              )
            : ''
        }
        <Form.Item wrapperCol={{ span: 23 }}>
          <div className='flex-row flex-jst-end flex-ali-center'>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
          </div>
        </Form.Item>
      </Form>
    </>
  )
}

export default EditModule
