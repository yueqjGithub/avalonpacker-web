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
  const ref: MutableRefObject<any> = useRef(null)
  const [form] = Form.useForm<AppDataRow>()
  const [signList, setList] = useState<string[]>([])
  const [signFileValue, setFileValue] = useState<string>()
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
        setList(res.data)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('获取签名文件失败')
    } finally {
      setSignLoading(false)
    }
  }
  const testUpload = () => {
    ref.current!.click()
  }

  const uploadHandler = async (e:ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : ''
    if (!file) {
      message.error('获取上传信息失败')
      return false
    }
    const fileName = file.name
    const fm = new FormData()
    fm.append('file', file)
    fm.append('type', '4')
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
        const copyList = [...signList]
        if (copyList.indexOf(fileName) === -1) {
          copyList.push(fileName)
        }
        setFileValue(fileName)
        setList(copyList)
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
  }, [])
  useEffect(() => {
    if (target) {
      setFileValue(target.signFilePath)
    }
  }, [target])
  return (
    <>
      <h3>{target?.appName || '新增应用'}</h3>
      <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/>
      <Form<AppDataRow> colon={true} form={form} labelAlign='right' labelCol={{ span: 4 }} wrapperCol={{ span: 18 }} onFinish={val => editFinshi(val)}>
        <Form.Item label="APP_ID" name="appId" rules={[{ required: true, message: 'APP_ID不能为空' }]}>
          <Input disabled={target !== undefined}/>
        </Form.Item>
        <Form.Item label="应用名称" name="appName" rules={[{ required: true, message: '应用名称不能为空' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="母包FTP路径" name="motherFtpPaths" rules={[{ required: true, message: '母包FTP路径不能为空' }]} help='多个路径请用英文,隔开，如/dungeonkeeper/cn/client/,/dungeonkeeper/global/client/'>
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
              <Form.Item label="SignFilePath" name="signFilePath" initialValue={target?.signFilePath}>
                <div className='flex-row flex-jst-btw flex-ali-center'>
                  <Select loading={signLoading} value={signFileValue}>
                    {
                      signList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                    }
                  </Select>
                  {
                    permissionList.upload ? <Button type='primary' className='ma-lf-05' onClick={() => testUpload()}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button> : ''
                  }
                </div>
              </Form.Item>
              <Form.Item label="signFileKeystorePassword" name="signFileKeystorePassword">
                <Input />
              </Form.Item>
              <Form.Item label="signFileKeyPassword" name="signFileKeyPassword">
                <Input />
              </Form.Item>
              <Form.Item label="signFileAlias" name="signFileAlias">
                <Input />
              </Form.Item>
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
