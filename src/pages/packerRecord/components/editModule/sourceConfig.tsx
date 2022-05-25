import { Button, Select } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { MutableRefObject, useRef } from 'react'
import { State } from '../../../../store/state'
import { RecordDataRow } from '../../common'

type Props = {
  target: RecordDataRow | undefined
  state: State
  submitVal: Function
}

const SourceConfig = ({ target, state, submitVal }: Props) => {
  const ref: MutableRefObject<any> = useRef(null)
  const { data: sourceList = [] } = getApiDataState<string[]>({ apiId: 'querySourceList', state })

  const testUpload = () => {
    ref.current!.click()
  }
  return (
    <div className='full-width'>
      {/* <input type="file" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/> */}
      <Select
      style={{ width: '100%' }}
      defaultValue={target!.sourceName}
      filterOption={true}
      showSearch
      onChange={val => {
        submitVal({ keyname: 'sourceName', val: val })
      }}
      >
        {
          sourceList.map(item => <Select.Option key={item} value={item}>{item}</Select.Option>)
        }
      </Select>
      <div className='full-width flex-row flex-jst-start flex-ali-base pa-col-md'>
        <h5 className='text-danger'>未找到母包？选择文件上传</h5>
        <Button type='primary' size='small' className='ma-lf-05' onClick={() => testUpload()}>上传</Button>
      </div>
    </div>
  )
}

export default SourceConfig
