import { Button, message, Switch, Tabs } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useMemo, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { PluginsDataRow, PluginTypeItem } from '../../plugins/common'
import { RecordDataRow } from '../common'

type Props = {
  state: State
  target: RecordDataRow | undefined
  editSuccess: Function
}

const PluginsSetting = ({ target, state, editSuccess }: Props) => {
  const { data = [] } = getApiDataState<PluginsDataRow[]>({ apiId: 'plugins', state })
  const { data: types = [] } = getApiDataState<PluginTypeItem[]>({ apiId: 'pluginstypes', state })
  const [cur, setCur] = useState<string>('full')
  const [checkedList, setList] = useState<string[]>(() => target?.pluginsList?.split(',') || [])
  const [loading, setLoading] = useState<boolean>(false)
  const dataList = useMemo(() => {
    return cur === 'full' ? data : data.filter(item => item.type === cur)
  }, [data, cur])
  const changeSet = (id: string, val: boolean) => {
    const list = [...checkedList]
    if (val) {
      list.push(id)
    } else {
      const idx = list.indexOf(id)
      list.splice(idx, 1)
    }
    setList(list)
  }
  /** 提交插件设置 */
  const submitHandler = async () => {
    const requestData = {
      recordId: target?.id,
      pluginIds: checkedList.join(',')
    }
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId: 'setplugins',
        state,
        method: 'POST',
        data: requestData
      }).request
      if (res.status === 0) {
        message.success('添加完成')
        editSuccess()
      } else {
        message.error(res.message || res.err_message)
      }
    } catch (e) {
      message.error('程序出错')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='full-width'>
      <div className='full-width flex-row flex-jst-btw flex-ali-start'>
        <Tabs tabPosition='left' onChange={val => setCur(val)}>
          <Tabs.TabPane key='full' tab='全部'></Tabs.TabPane>
          {
            types.map(item => <Tabs.TabPane key={item.type} tab={item.typeName}></Tabs.TabPane>)
          }
        </Tabs>
        <div className='flex-1 pa-row-md scroll-bar' style={{ height: '65vh' }}>
          {
            dataList.map(item => {
              return (
                <div className='full-width pa-row-md pa-col-sm flex-row flex-jst-btw flex-ali-center border-1 ma-col-sm' key={item.id}>
                  <div className='flex-col flex-jst-start flex-ali-start'>
                    <h4 className='font-bold'>{item.name}</h4>
                    <span className='font-12 text-grey'>{item.description}</span>
                  </div>
                  <Switch defaultChecked={checkedList.includes(item.id!)} onChange={val => changeSet(item.id!, val)}></Switch>
                </div>
              )
            })
          }
        </div>
      </div>
      <div className='full-width pa-row-md flex-row flex-jst-end flex-ali-center pa-col-sm'>
        <Button type='primary' onClick={submitHandler} loading={loading}>提交</Button>
      </div>
    </div>
  )
}

export default PluginsSetting
