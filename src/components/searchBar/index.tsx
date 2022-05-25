import { Button, Input, Select, Form, DatePicker } from 'antd'
import { Dayjs } from 'dayjs'
import React, { useEffect, useState } from 'react'
import locale from 'antd/lib/calendar/locale/zh_CN.js'
import { Moment } from 'moment'
import styles from './style.module.scss'

/** 搜索项类型 */
type SearchInTypes = 'input' | 'select' | 'timepick' | 'timerange'

/** 搜索框为select时，强制传入source遍历出下拉 */
export type SelectSource = {
  label: string
  value: any
  [keyName:string]: any
}

/** 单个搜索项基础类型 */
type SearchItemBasic<T extends SearchInTypes> = {
  type: T
  label: string
  keyName: string
  placeholder?: string
  defaultValue?: any
  style?: React.CSSProperties
  isCollpased?: boolean
}

/** 搜索项类型集合 */
type SearchTypeRows = {
  input: SearchItemBasic<'input'>
  select: SearchItemBasic<'select'> & {source: SelectSource[]}
  timepick: SearchItemBasic<'timepick'> & {defaultTime?: [Dayjs, Dayjs], showTime?: boolean}
  timerange: SearchItemBasic<'timerange'> & {defaultTime?: [Moment, Moment], format?: string, showTime?: boolean}
}
/** 单个搜索项最终类型 */
type SearchItem<T extends SearchInTypes> = SearchTypeRows[T]

type Props = {
  searchOptions: SearchItem<SearchInTypes>[]
  onSearch: Function
  onReset?: Function
  otherComponent?: JSX.Element | Element
  size?: 'small' | 'middle' | 'large' | undefined
  hideReset?: boolean
  resetSymbol?: any
}

const SearchBar = (props: Props) => {
  const { searchOptions, onSearch, otherComponent, hideReset, onReset, resetSymbol } = props
  const [form] = Form.useForm()
  const [colled, setColled] = useState<boolean>(false)
  const Item = (ele: SearchItem<SearchInTypes>) => {
    switch (ele.type) {
      case 'input':
        return <Input placeholder={ele.placeholder} size={props.size} style={ele.style}/>
      case 'select':
        return (
          <Select style={{ minWidth: 170 }} size={props.size} placeholder={ele.placeholder} >
            {ele.source.map(d => <Select.Option key={d.value} value={d.value}>{d.label}</Select.Option>)}
          </Select>
        )
      case 'timerange':
        return (
          <DatePicker.RangePicker
          locale={locale}
          format={ele.format}
          showTime={ele.showTime}
          />
        )
      default:
        return <></>
    }
  }
  const resetHandler = () => {
    form.resetFields()
    onReset ? onReset() : onSearch({})
  }
  useEffect(() => {
    form.resetFields()
    if (onReset) {
      onReset()
    }
  }, [resetSymbol])
  const normalOptions = searchOptions.filter(item => !item.isCollpased)
  const collpasedOptions = searchOptions.filter(item => item.isCollpased)
  return (
    <div className='full-width flex-row flex-jst-start flex-ali-center'>
      <div className='full-width flex-row flex-jst-start flex-ali-start flex-wrap'>
        <Form form={form} layout="inline">
          <div className='full-width flex-row flex-jst-start flex-ali-center'>
            {
              normalOptions.map(item => {
                return (
                  <Form.Item label={item.label} key={item.keyName} name={item.keyName} initialValue={item.defaultValue}>
                    {Item(item)}
                  </Form.Item>
                )
              })
            }
            <div className='flex-1 flex-row flex-jst-start flex-ali-center'>
              <Button type="primary" size={props.size} style={{ margin: '0 10px' }} onClick={() => {
                const obj = {}
                const cur = form.getFieldsValue()
                for (const k in cur) {
                  if (cur[k] !== undefined && cur[k] !== '') {
                    obj[k] = cur[k]
                  }
                }
                onSearch(obj)
              }}>搜索</Button>
              {
                (collpasedOptions.length > 0 && !colled) && <Button type='primary' onClick={() => setColled(true)}>高级搜索</Button>
              }
              {
                colled && <Button type='primary' onClick={() => setColled(false)}>收起</Button>
              }
              {
                hideReset
                  ? ''
                  : (
                  <Button type="primary" size={props.size} onClick={resetHandler} className='ma-lf-05'>重置</Button>
                    )
              }
              {otherComponent}
            </div>
          </div>
          <div className={`full-width flex-row flex-jst-start flex-ali-center ${styles.searchCollapased}`} style={colled ? { maxHeight: 200 } : { maxHeight: 0 }}>
            {
              colled && collpasedOptions.map(item => {
                return (
                  <Form.Item label={item.label} key={item.keyName} name={item.keyName} initialValue={item.defaultValue}>
                    {Item(item)}
                  </Form.Item>
                )
              })
            }
          </div>
        </Form>
      </div>
    </div>
  )
}

export default SearchBar
