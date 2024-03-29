import { Button, Divider, Form, Input, message, notification, Select, Spin, Tabs } from 'antd'
import React, { ChangeEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { State } from '../../../../store/state'
import { EnvDataRow, RecordDataRow, RecordPlugins } from '../../common'
import BaseConfig from './baseConfig'
import PluginsConfig from './pluginConfig'
import IconConfig from './iconConfig'
import SplashConfig from './splashConfig'
// import SourceConfig from './sourceConfig'
import { httpApi, httpWithStore } from '../../../../service/axios'
import { getApiDataState } from 'avalon-iam-util-client'
import { AppDataRow } from '../../../setgame/common'
import { cloneDeep } from 'lodash'
import { _deepClone } from '../../../../utils/utils'
type Props = {
  target: RecordDataRow | undefined
  initView?: string
  state: State
  editSuccess: Function
  dispatch: any
  alreadyPlugins: RecordPlugins[]
  isCopy: boolean
}

// type TabItem = {
//   key: string
//   tab: string
//   component: JSX.Element | Element
// }

type ChannelVersionData = string[]

const EditModule = ({ target, initView, state, editSuccess, dispatch, alreadyPlugins, isCopy }: Props) => {
  const { isMac } = state
  const targetRef = useRef({ ...target })
  const [otherFileSave, setSave] = useState<string[]>([])
  const { user } = state
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  const ref: MutableRefObject<any> = useRef(null)
  const [signList, setList] = useState<string[]>([])
  const [descList, setDescList] = useState<string[]>([])
  const [signLoading, setSignLoading] = useState<boolean>(false)
  const submitCount = useRef<number>(0)
  const { data, loading: spinning } = getApiDataState<ChannelVersionData>({ apiId: 'getchannelsource', state })
  const { data: envAllList = [] } = getApiDataState<EnvDataRow[]>({ apiId: 'envlist', state })
  const envList = useMemo(() => {
    return envAllList.filter(item => item.enable === true)
  }, [envAllList])
  const [loading, setLoading] = useState<boolean>(false)
  const [submitSymbol, setSymbol] = useState<boolean>()
  const [form] = Form.useForm<RecordDataRow>()
  const queryChannelSource = async () => {
    try {
      await httpWithStore({
        apiId: 'getchannelsource',
        data: {
          type: '1',
          id: target?.channelId
        },
        state,
        dispatch,
        force: true,
        httpCustomConfig: {
          timeout: 1000 * 60 * 5
        }
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
    const copy = { ...targetRef.current }
    copy.macOtherFile = targetRef.current.macOtherFile?.join(',') || null
    copy.otherFile = targetRef.current.otherFile?.join(',') || null
    try {
      const { data: res } = await httpApi({
        state,
        apiId: isCopy ? 'addrecord' : 'updaterecord',
        method: 'POST',
        data: { ...copy, lastUpdateAs: user.id, isCopy, pluginList: alreadyPlugins }
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
  const getVal = (params: { keyname: keyof RecordDataRow, val: any, add?: boolean }) => {
    const { keyname, val, add } = params
    targetRef.current[keyname] = val
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
        if (isMac) {
          setDescList(res.data.descList)
        }
        setList(res.data.signList)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('获取签名文件失败')
    } finally {
      setSignLoading(false)
    }
  }
  const [uploadType, setUploadType] = useState<5 | 8 | 9>(5)
  const testUpload = (type: 5 | 8 | 9) => {
    setUploadType(type)
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
    fm.append('type', String(uploadType))
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
        const cur = form.getFieldsValue()
        if (uploadType === 5) { // 上传渠道签名
          const copyList = [...signList]
          if (copyList.indexOf(fileName) === -1) {
            copyList.push(fileName)
          }
          if (isMac) {
            cur.macSignFile = fileName
            getVal({ keyname: 'macSignFile', val: fileName })
          } else {
            cur.signFilePath = fileName
            getVal({ keyname: 'signFilePath', val: fileName })
          }
          setList(copyList)
        } else if (uploadType === 8) {
          const copyList = [...descList]
          if (copyList.indexOf(fileName) === -1) {
            copyList.push(fileName)
          }
          cur.descFileName = fileName
          getVal({ keyname: 'descFileName', val: fileName })
          setDescList(copyList)
        } else { // == 10
          const copyList = (isMac ? targetRef.current.macOtherFile : targetRef.current.otherFile) || []
          if (copyList.indexOf(fileName) === -1) {
            copyList.push(fileName)
          }
          if (isMac) {
            getVal({ keyname: 'macOtherFile', val: copyList })
          } else {
            getVal({ keyname: 'otherFile', val: copyList })
          }
          setSave(cloneDeep(copyList))
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
      const copy = _deepClone(target)
      setSave(isMac ? target.macOtherFile : target.otherFile)
      if (isCopy) {
        const cName = `${copy.configName}（复制）`
        if (cName.length > 60) {
          notification.warning({
            message: '配置名称超出长度',
            description: '名字长度超过 60 字符，请修改配置名字'
          })
        }
        copy.configName = cName
        targetRef.current.configName = cName
      }
      form.setFieldsValue(copy)
      querySignPath(cancelObj)
    }
    return () => {
      if (cancelObj.querysignpath) {
        cancelObj.querysignpath.cancel()
      }
    }
  }, [])

  const submitHandler = async () => {
    // 检查icon
    const iconUrl = targetRef.current.iconUrl

    if (iconUrl === null || iconUrl?.split(',').some(d => d === '')) {
      notification.warning({
        message: '参数错误提示',
        description: 'icon未配置'
      })
      return
    }

    try {
      await form.validateFields()
      submitCount.current = submitCount.current + 1
      changeSymbol()
    } catch {
      submitCount.current = 0
      notification.warning({
        message: '参数错误提示',
        description: '基础配置未正确填写'
      })
    }
  }
  // 删除其他文件
  const delFile = (name: string) => {
    const idx = otherFileSave.indexOf(name)
    if (idx !== -1) {
      const copy = [...otherFileSave]
      copy.splice(idx, 1)
      if (isMac) {
        targetRef.current.macOtherFile = copy
      } else {
        targetRef.current.otherFile = copy
      }
      setSave(copy)
    }
  }
  return (
    <div className='full-width'>
      <Spin spinning={spinning}>
        <div className='full-width flex-row flex-jst-btw flex-ali-start'>
          <div className='flex-1 pa-row-md scroll-bar' style={{ height: '65vh' }}>
            <Tabs tabPosition='left' defaultActiveKey={initView}>
              {/* {
                tabList.map(item => <Tabs.TabPane forceRender={true} key={item.key} tab={item.tab}>{item.component}</Tabs.TabPane>)
              } */}
              <Tabs.TabPane forceRender key='1' tab='基础配置'>
              <>
                <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/>
                <Form layout='vertical' form={form}>
                  <Form.Item
                    label='配置名称'
                    normalize={val => val.trim()}
                    required
                    name='configName'
                    rules={[{ required: true, message: '配置名称不能为空!' }, { max: 60, message: '配置名称不能超过60个字符' }]}
                  >
                    <Input maxLength={60} showCount placeholder='请输入配置名称' onChange={e => getVal({ keyname: 'configName', val: e.target.value })}></Input>
                  </Form.Item>
                  <Form.Item normalize={val => val.trim()} label={isMac ? 'bundleId' : '渠道包名'} required initialValue={target?.packerName} name='packerName' rules={[{ required: true, message: '不能为空!' }]}>
                    <Input placeholder={`请输入${isMac ? 'bundleId' : '渠道包名'}`} onChange={e => getVal({ keyname: 'packerName', val: e.target.value })}></Input>
                  </Form.Item>
                  <Form.Item normalize={val => val.trim()} label='发行区域' name='publicArea' initialValue={target?.publicArea}>
                    <Input placeholder='请填写发行区域代码，如CN、US、GLOBAL' onChange={e => getVal({ keyname: 'publicArea', val: e.target.value })}></Input>
                  </Form.Item>
                  <Form.Item label='SDK环境' name='envCode' initialValue={target?.envCode} rules={[{ required: true, message: '请设置SDK环境!' }]}>
                    <Select onChange={val => getVal({ keyname: 'envCode', val: val })}>
                      {
                        envList.map(item => <Select.Option key={item.envCode} value={item.envCode}>{item.envDesc}</Select.Option>)
                      }
                    </Select>
                  </Form.Item>
                  <Form.Item label='游戏默认安装名' initialValue={target?.gameName} name='gameName' >
                    <Input placeholder='请输入游戏默认安装名' onChange={e => getVal({ keyname: 'gameName', val: e.target.value })}></Input>
                  </Form.Item>
                  {
                    !isMac && (
                      <>
                        <Form.Item label='产物' name='resultType' required initialValue={target?.resultType} rules={[{ required: true, message: '请选择打包产物!' }]}>
                          <Select onChange={val => getVal({ keyname: 'resultType', val: val })}>
                            <Select.Option value={'apk'}>apk</Select.Option>
                            <Select.Option value={'aab'}>aab</Select.Option>
                          </Select>
                        </Form.Item>
                      </>
                    )
                  }
                  <Divider></Divider>
                  <div className='full-width flex-row flex-jst-start flex-ali-center'>
                    <Form.Item
                    className='flex-1'
                    shouldUpdate
                    label={isMac ? 'IOS证书' : 'signFilePath'}
                    name={isMac ? 'macSignFile' : 'signFilePath'}
                    initialValue={isMac ? target?.macSignFile : target?.signFilePath}
                    >
                      <Select loading={signLoading} allowClear onChange={val => {
                        getVal({ keyname: isMac ? 'macSignFile' : 'signFilePath', val: val || null })
                      }}
                      >
                        {
                          signList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                        }
                      </Select>
                    </Form.Item>
                    <Button type='primary' style={{ marginTop: 7 }} className='ma-lf-05' onClick={() => testUpload(5)}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button>
                  </div>
                  {
                    isMac
                      ? (
                        <>
                            <div className='flex-row flex-jst-start flex-ali-center'>
                              <Form.Item shouldUpdate className='flex-1' label='IOS描述文件' name='descFileName' initialValue={target?.descFileName}>
                                <Select loading={signLoading} allowClear onChange={val => getVal({ keyname: 'descFileName', val: val || null })}>
                                  {
                                    descList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
                                  }
                                </Select>
                              </Form.Item>
                              <Button type='primary' style={{ marginTop: 7 }} className='ma-lf-05' onClick={() => testUpload(8)}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button>
                            </div>
                            <Form.Item normalize={val => val.trim()} label="IOS证书密码" initialValue={target?.macCertPwd} name='macCertPwd'>
                              <Input onChange={e => getVal({ keyname: 'macCertPwd', val: e.target.value })}></Input>
                            </Form.Item>
                        </>
                        )
                      : (
                      <>
                        <Form.Item normalize={val => val.trim()} label="signFileKeystorePassword" initialValue={target?.signFileKeystorePassword} name='signFileKeystorePassword'>
                          <Input onChange={e => getVal({ keyname: 'signFileKeystorePassword', val: e.target.value })}></Input>
                        </Form.Item>
                        <Form.Item normalize={val => val.trim()} label="signFileKeyPassword" initialValue={target?.signFileKeyPassword} name='signFileKeyPassword'>
                          <Input onChange={e => getVal({ keyname: 'signFileKeyPassword', val: e.target.value })}></Input>
                        </Form.Item>
                        <Form.Item normalize={val => val.trim()} label="signFileAlias" initialValue={target?.signFileAlias} name='signFileAlias'>
                          <Input onChange={e => getVal({ keyname: 'signFileAlias', val: e.target.value })}></Input>
                        </Form.Item>
                      </>
                        )
                  }
                  <Form.Item label="其他文件上传" shouldUpdate name={isMac ? 'macOtherFile' : 'otherFile'}>
                    <div className="full-width flex-row flex-jst-start flex-ali-start">
                      <div className='flex-col flex-jst-start flex-ali-start'>
                        <>
                          {
                            otherFileSave && otherFileSave?.map(item => {
                              return (
                                <div key={item} className='full-width flex-row flex-jst-start flex-ali-center'>
                                  <span>{item}</span>
                                  <Button className='ma-lf-05' type="primary" danger size='small' shape='circle' onClick={() => delFile(item)}>X</Button>
                                </div>
                              )
                            })
                          }
                        </>
                      </div>
                      <Button type='primary' className='ma-lf-05' onClick={() => testUpload(9)}><i className='iconfont icon-cloudupload-fill text-white'></i>上传</Button>
                    </div>
                  </Form.Item>
                </Form>
              </>
              </Tabs.TabPane>
              <Tabs.TabPane forceRender key='2' tab='渠道参数'>
                <BaseConfig channelSourceList={data || []} state={state} target={target!} submitSymbol={submitSymbol} submitVal={getVal} clearCount={() => { submitCount.current = 0 }}/>
              </Tabs.TabPane>
              <Tabs.TabPane forceRender key='3' tab='插件参数'>
                <PluginsConfig alreadyPlugins={alreadyPlugins} state={state} target={target!} submitSymbol={submitSymbol} submitVal={getVal} clearCount={() => { submitCount.current = 0 }}/>
              </Tabs.TabPane>
              <Tabs.TabPane forceRender key='4' tab='ICON'>
                <IconConfig target={target} state={state} submitVal={getVal} />
              </Tabs.TabPane>
              <Tabs.TabPane forceRender key='5' tab='闪屏配置'>
                <SplashConfig target={target} state={state} submitVal={getVal} />
              </Tabs.TabPane>
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
