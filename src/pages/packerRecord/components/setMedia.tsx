import { Button, message, Switch } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { useState } from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'
import { MediaFlagDataRow } from '../../mediaFlag/common'
import { RecordDataRow } from '../common'

type Props = {
  state: State
  target: RecordDataRow | undefined
  editSuccess: Function
}

const PluginsSetting = ({ target, state, editSuccess }: Props) => {
  const { data = [] } = getApiDataState<MediaFlagDataRow[]>({ apiId: 'mediaflag', state })
  const [checkedList, setList] = useState<string[]>(() => target?.mediaList?.split(',') || [])
  const [loading, setLoading] = useState<boolean>(false)
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
      mediaIds: checkedList.join(',')
    }
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId: 'setmedia',
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
        <div className='flex-1 pa-row-md scroll-bar' style={{ height: '65vh' }}>
          <div className='full-width pa-row-md pa-col-sm flex-row flex-jst-btw flex-ali-base ma-col-sm'>
            <div className='flex-1 text-align-center'>媒体标识ID</div>
            <div className='flex-1 text-align-center'>媒体标识名称</div>
            <div className='flex-2 text-align-center'>备注</div>
            <div className='flex-1 text-align-center'>启用状态</div>
          </div>
          {
            data.map(item => {
              return (
                <div className='full-width pa-row-md pa-col-sm flex-row flex-jst-btw flex-ali-base ma-col-sm' key={item.id}>
                  <div className='flex-1 flex-row flex-jst-center flex-ali-center'>{item.code}</div>
                  <div className='flex-1 flex-row flex-jst-center flex-ali-center'>{item.mediaName}</div>
                  <div className='flex-2 flex-row flex-jst-center flex-ali-center'>{item.description}</div>
                  <div className='flex-1 flex-row flex-jst-center flex-ali-center'>
                    <Switch defaultChecked={checkedList.includes(item.id!)} onChange={val => changeSet(item.id!, val)}></Switch>
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
