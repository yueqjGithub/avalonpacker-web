import { Button, Divider, Form, Input, message, notification, Select, Spin, Tabs } from 'antd'
import React, { ChangeEvent, MutableRefObject, useEffect, useRef, useState } from 'react'
import { State } from '../../../../store/state'
import { EnvDataRow, RecordDataRow } from '../../common'
import BaseConfig from './baseConfig'
import PluginsConfig from './pluginConfig'
import IconConfig from './iconConfig'
import SplashConfig from './splashConfig'
// import SourceConfig from './sourceConfig'
import { httpApi, httpWithStore } from '../../../../service/axios'
import { getApiDataState } from 'avalon-iam-util-client'
import { AppDataRow } from '../../../setgame/common'
type Props = {
  target: RecordDataRow | undefined
  initView?: string
  state: State
  editSuccess: Function
  dispatch: any
}

type TabItem = {
  key: string
  tab: string
  component: JSX.Element | Element
}

type ChannelVersionData = {
  versions: string[]
}

const EditModule = ({ target, initView, state, editSuccess, dispatch }: Props) => {
  const targetRef = useRef({ ...target })
  const { user } = state
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  // const currentGameInfo = useMemo(() => {
  //   return gameList.find(item => item.id === currentGame)
  // }, [currentGame, gameList])
  const ref: MutableRefObject<any> = useRef(null)
  const [signList, setList] = useState<string[]>([])
  // const [signFileValue, setFileValue] = useState<string>()
  const [signLoading, setSignLoading] = useState<boolean>(false)
  const submitCount = useRef<number>(0)
  const { data, loading: spinning } = getApiDataState<ChannelVersionData>({ apiId: 'getchannelsource', state })
  const { data: envList = [] } = getApiDataState<EnvDataRow[]>({ apiId: 'envlist', state })
  const [loading, setLoading] = useState<boolean>(false)
  const [submitSymbol, setSymbol] = useState<boolean>()
  const [form] = Form.useForm()
  const queryChannelSource = async () => {
    try {
      await httpWithStore({
        apiId: 'getchannelsource',
        state,
        dispatch,
        force: true,
        targetId: target?.id
      })
    } catch {
      message.error('获取渠道版本出错')
    }
  }
  useEffect(() => {
    queryChannelSource()
  }, [])
  const changeSymbol = async () => {
    const r = !submitSymbol
    await setSymbol(r)
  }
  const doSubmit = async () => {
    try {
      const { data: res } = await httpApi({
        state,
        apiId: 'updaterecord',
        method: 'POST',
        data: { ...targetRef.current, lastUpdateAs: user.id }
      }).request
      if (res.status === 0) {
        message.success('提交成功')
        editSuccess()
      } else {
        message.error(res.message || res.err_message)
      }
    } catch {
      message.error('程序出错')
    } finally {
      submitCount.current = 0
      setLoading(false)
    }
  }
  const getVal = (params: { keyname: any, val: any, add?: boolean }) => {
    const { keyname, val, add } = params
    const obj = { ...targetRef.current }
    obj[keyname] = val
    targetRef.current = { ...obj }
    if (add) {
      submitCount.current = submitCount.current + 1
    }
    if (submitCount.current === 3) {
      doSubmit()
    }
  }
  const querySignPath = async (cancelObj) => {
    const { request, cancel } = httpApi({
      apiId: 'querychannelsignpath',
      state,
      targetId: target?.channelId
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
    fm.append('type', '5')
    const targetApp = gameList.find(item => item.id === target?.appId)
    fm.append('appId', targetApp?.appId!)
    fm.append('channelId', target?.channelId!)
    fm.append('recordId', target?.id!)
    try {
      setLoading(false)
      const { data: res } = await httpApi({
        apiId: 'uploadimg',
        state,
        method: 'POST',
        data: fm
      }).request
      if (res.status === 0) {
        const copyList = [...signList]
        if (copyList.indexOf(fileName) === -1) {
          copyList.push(fileName)
        }
        // setFileValue(fileName)
        getVal({ keyname: 'signFilePath', val: fileName })
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
  // useEffect(() => {
  //   if (target) {
  //     setFileValue(target.signFilePath)
  //   }
  // }, [target])
  const tabList: TabItem[] = [
    // {
    //   key: '0',
    //   tab: '母包选择',
    //   component: <SourceConfig submitVal={getVal} target={target} state={state}></SourceConfig>
    // },
    {
      key: '1',
      tab: '基础配置',
      component: (
        // <Input defaultValue={target?.packerName} placeholder='请输入渠道包名' onChange={e => getVal({ keyname: 'packerName', val: e.target.value })}></Input>
        <>
          <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/>
          <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 19 }}>
            <Form.Item label='渠道包名' required initialValue={target?.packerName} name='packerName' rules={[{ required: true, message: '渠道包名不能为空!' }]}>
              <Input placeholder='请输入渠道包名' onChange={e => getVal({ keyname: 'packerName', val: e.target.value })}></Input>
            </Form.Item>
            <Form.Item label='安装游戏名' initialValue={target?.gameName} name='gameName' >
              <Input placeholder='请输入安装游戏名' onChange={e => getVal({ keyname: 'gameName', val: e.target.value })}></Input>
            </Form.Item>
            {/* <Form.Item label='versionCode' help={'请注意：执行分包后，versionCode会增加1,可在应用管理界面自定义versionCode'}>
              <InputNumber min={0} placeholder='请输入内部版本号' onChange={val => getVal({ keyname: 'versionCode', val })}></InputNumber>
              <span>{currentGameInfo?.versionCode}</span>
            </Form.Item> */}
            <Form.Item label='发行区域' name='publicArea' initialValue={target?.publicArea}>
              <Input placeholder='请填写发行区域代码，如CN、US、GLOBAL' onChange={e => getVal({ keyname: 'publicArea', val: e.target.value })}></Input>
            </Form.Item>
            <Form.Item label='SDK环境' name='envCode' initialValue={target?.envCode} rules={[{ required: true, message: '请设置SDK环境!' }]}>
              <Select onChange={val => getVal({ keyname: 'envCode', val: val })}>
                {
                  envList.map(item => <Select.Option key={item.envCode} value={item.envCode}>{item.envDesc}</Select.Option>)
                }
              </Select>
            </Form.Item>
            <Form.Item label='产物' name='resultType' required initialValue={target?.resultType} rules={[{ required: true, message: '请选择打包产物!' }]}>
              <Select onChange={val => getVal({ keyname: 'resultType', val: val })}>
                <Select.Option value={'apk'}>apk</Select.Option>
                <Select.Option value={'aab'}>aab</Select.Option>
              </Select>
            </Form.Item>
            <Divider></Divider>
            <Form.Item label="SignFilePath" name='signFilePath'>
                <div className='flex-row flex-jst-btw flex-ali-center'>
                  <Select loading={signLoading} defaultValue={target?.signFilePath} allowClear onChange={val => getVal({ keyname: 'signFilePath', val: val })}>
                    {
                      signList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                    }
                  </Select>
                  <Button type='primary' className='ma-lf-05' onClick={() => testUpload()}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button>
                </div>
            </Form.Item>
            <Form.Item label="signFileKeystorePassword" initialValue={target?.signFileKeystorePassword} name='signFileKeystorePassword'>
              <Input onChange={e => getVal({ keyname: 'signFileKeystorePassword', val: e.target.value })}></Input>
            </Form.Item>
            <Form.Item label="signFileKeyPassword" initialValue={target?.signFileKeyPassword} name='signFileKeyPassword'>
              <Input onChange={e => getVal({ keyname: 'signFileKeyPassword', val: e.target.value })}></Input>
            </Form.Item>
            <Form.Item label="signFileAlias" initialValue={target?.signFileAlias} name='signFileAlias'>
              <Input onChange={e => getVal({ keyname: 'signFileAlias', val: e.target.value })}></Input>
            </Form.Item>
          </Form>
        </>
      )
    },
    {
      key: '2',
      tab: '渠道参数',
      component: <BaseConfig channelSourceList={data?.versions || []} state={state} target={target!} submitSymbol={submitSymbol} submitVal={getVal} clearCount={() => { submitCount.current = 0 }}/>
    },
    {
      key: '3',
      tab: '插件参数',
      component: <PluginsConfig state={state} target={target!} submitSymbol={submitSymbol} submitVal={getVal} clearCount={() => { submitCount.current = 0 }}/>
    },
    {
      key: '4',
      tab: 'ICON',
      component: <IconConfig target={target} state={state} submitVal={getVal} />
    },
    {
      key: '5',
      tab: '闪屏配置',
      component: <SplashConfig target={target} state={state} submitVal={getVal} />
    }
  ]

  const submitHandler = async () => {
    // if (!targetRef.current.sourceName) {
    //   submitCount.current = 0
    //   notification.warning({
    //     message: '参数缺失提示',
    //     description: '未配置母包'
    //   })
    // } else {
    //   submitCount.current = submitCount.current + 1
    // }
    try {
      await form.validateFields()
      submitCount.current = submitCount.current + 1
      changeSymbol()
    } catch {
      submitCount.current = 0
      notification.warning({
        message: '参数缺失提示',
        description: '基础配置不完整'
      })
    }
  }
  return (
    <div className='full-width'>
      <Spin spinning={spinning}>
        <div className='full-width flex-row flex-jst-btw flex-ali-start'>
          <div className='flex-1 pa-row-md scroll-bar' style={{ height: '65vh' }}>
            <Tabs tabPosition='left' defaultActiveKey={initView}>
              {
                tabList.map(item => <Tabs.TabPane forceRender={true} key={item.key} tab={item.tab}>{item.component}</Tabs.TabPane>)
              }
            </Tabs>
          </div>
        </div>
        <div className='full-width pa-row-md flex-row flex-jst-end flex-ali-center pa-col-sm'>
          <Button type='primary' onClick={submitHandler} loading={loading}>提交</Button>
        </div>
      </Spin>
    </div>
  )
}

export default EditModule
