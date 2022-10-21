import { Button, message, Select, Spin, Switch, Tabs } from 'antd'
import { getApiDataState, setApiDataState } from 'avalon-iam-util-client'
import React, { useMemo, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { PluginsDataRow, PluginTypeItem } from '../../plugins/common'
import { RecordDataRow, RecordPlugins } from '../common'

type Props = {
  state: State
  target: RecordDataRow | undefined
  editSuccess: Function
  alreadyPlugins: RecordPlugins[]
  dispatch: any
}

const PluginsSetting = ({ target, state, editSuccess, dispatch, alreadyPlugins }: Props) => {
  const { data = [] } = getApiDataState<PluginsDataRow[]>({ apiId: 'plugins', state })
  const { data: types = [] } = getApiDataState<PluginTypeItem[]>({ apiId: 'pluginstypes', state })
  const [cur, setCur] = useState<string>('full')
  const [checkedList, setList] = useState<RecordPlugins[]>(() => alreadyPlugins.filter(item => item.recordId === target?.id) || [])
  const [loading, setLoading] = useState<boolean>(false)
  const dataList = useMemo(() => {
    return cur === 'full' ? data : data.filter(item => item.type === cur)
  }, [data, cur])

  const setVersion = (id, val) => {
    const list = [...checkedList]
    // const target = list.find(item => item.pluginsId === id)
    list.forEach(item => {
      if (item.pluginsId === id) {
        item.pluginsVersion = val
      }
    })
    setList(list)
  }
  /** 提交插件设置 */
  const submitHandler = async () => {
    setLoading(true)
    try {
      checkedList.forEach(item => {
        if (!item.pluginsVersion) {
          const pName = data.find(p => p.id === item.pluginsId)?.name
          throw new Error(`插件${pName}未设置版本`)
        }
      })
      const requestData = {
        recordId: target?.id,
        pluginIds: checkedList
      }
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
      message.error((e as Error).message || '程序出错')
    } finally {
      setLoading(false)
    }
  }
  // 获取版本
  const queryVersion = async (id: string) => {
    const targetPlugins = data.find(item => item.id === id)
    if (targetPlugins?.versions!.length! > 0) {
      return
    }
    data.forEach(item => {
      if (item.id === id) {
        item.fetch = true
      }
    })
    setApiDataState({ apiId: 'plugins', dispatch, data })
    const { data: res } = await httpApi({
      apiId: 'getchannelsource',
      state,
      method: 'GET',
      data: { id, type: '2' }
    }).request
    data.forEach(item => {
      if (item.id === id) {
        const result: string[] = res.data.sort((a: string, b: string) => b.localeCompare(a))
        item.versions = result
        item.fetch = false
      }
    })
    setApiDataState({ apiId: 'plugins', dispatch, data })
  }
  const changeSet = async (id: string, val: boolean) => {
    const list = [...checkedList]
    if (val) {
      try {
        await queryVersion(id)
        list.push({
          pluginsId: id,
          recordId: target?.id || '',
          pluginsVersion: dataList.find(item => item.id === id)?.versions![0] || ''
        })
      } catch {
        message.error('获取版本失败')
      }
    } else {
      const target = list.find(item => item.pluginsId === id)
      const idx = list.indexOf(target!)
      list.splice(idx, 1)
    }
    setList(list)
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
        <div className='flex-1 pa-row-md scroll-bar' id='selectScrollContainer' style={{ height: '65vh', position: 'relative' }}>
          {
            dataList.map(item => {
              return (
                <div className='full-width pa-row-md pa-col-sm flex-row flex-jst-btw flex-ali-center border-1 ma-col-sm' key={item.id}>
                  <div className='flex-col flex-jst-start flex-ali-start'>
                    <h4 className='font-bold'>{item.name}</h4>
                    <span className='font-12 text-grey'>{item.description}</span>
                  </div>
                  <div className='flex-row flex-jst-start flex-ali-center'>
                    {
                      checkedList.find(j => j.pluginsId === item.id) && (
                        <Select style={{ width: 120, marginRight: 10, textAlign: 'right' }} placeholder='版本选择'
                        options={item.versions?.map(j => ({ label: j, value: j })) || []}
                        // onDropdownVisibleChange={val => val && queryVersion(item.id!)}
                        notFoundContent={item.fetch ? <Spin size="small" /> : null}
                        onSelect={val => setVersion(item.id!, val)}
                        defaultValue={checkedList.find(j => j.pluginsId === item.id)?.pluginsVersion}
                        dropdownStyle={{
                          textAlign: 'right'
                        }}
                        getPopupContainer={() => document.querySelector('#selectScrollContainer')!}
                        ></Select>
                      )
                    }
                    <Switch loading={item.fetch} checked={checkedList.find(j => j.pluginsId === item.id) !== undefined} onClick={val => changeSet(item.id!, val)}></Switch>
                  </div>
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
