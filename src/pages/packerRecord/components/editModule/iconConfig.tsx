import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, message, Modal, Space, Spin } from 'antd'
import { getApiDataState } from 'avalon-iam-util-client'
import React, { ChangeEvent, MutableRefObject, useEffect, useRef, useState } from 'react'
import { httpApi } from '../../../../service/axios'
import { State } from '../../../../store/state'
import { AppDataRow } from '../../../setgame/common'
import { RecordDataRow } from '../../common'
import styles from './styles/upload.module.scss'
type Props = {
  target: RecordDataRow | undefined
  state: State
  submitVal: Function
}

const IconConfig = ({ target, state, submitVal }: Props) => {
  const ref: MutableRefObject<any> = useRef(null)
  const ref1: MutableRefObject<any> = useRef(null)
  const ref2: MutableRefObject<any> = useRef(null)
  const [loading, setLoading] = useState<boolean>(false)
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  const [filePath, setPath] = useState<string>('')
  const [filePath1, setPath1] = useState<string>('')
  const [filePath2, setPath2] = useState<string>('')
  // const testUpload = () => {
  //   ref.current!.click()
  // }
  useEffect(() => {
    if (target?.iconUrl) {
      const arr = target.iconUrl.split(',')
      setPath(arr[0])
      if (arr.length === 2) {
        setPath1(arr[1])
        setPath2(arr[2])
      }
    }
  }, [target])
  const uploadHandler = async (e:ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files ? e.target.files[0] : ''
    if (!file) {
      message.error('获取上传信息失败')
      return false
    }
    const fileType = file.name.split('.').pop()
    if (fileType !== 'png') {
      message.error('仅支持Png格式的图片上传')
      return false
    }
    const size = file.size / 1024 / 1024
    if (size > 2) {
      message.error('大小不能超过2M')
      return false
    }

    const fm = new FormData()
    fm.append('file', file)
    fm.append('type', '1')
    const targetApp = gameList.find(item => item.id === target?.appId)
    fm.append('appId', targetApp?.appId!)
    fm.append('channelId', target?.channelId!)
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId: 'uploadimg',
        state,
        method: 'POST',
        data: fm
      }).request
      if (res.status === 0) {
        message.success('上传成功')
        if (index === 0) {
          setPath(res.data)
        } else if (index === 1) {
          setPath1(res.data)
        } else if (index === 2) {
          setPath2(res.data)
        }

        // 服务器不让新加字段，让使用一个字段用逗号隔开
        const newData = [filePath, filePath1, filePath2]
        newData[index] = res.data
        const val = newData.join(',')
        submitVal({ keyname: 'iconUrl', val: val })
      } else {
        message.error(res.error_msg || res.message)
      }
    } catch (e) {
      message.error('上传出错')
    } finally {
      if (index === 0) {
        ref.current.value = ''
      } else if (index === 1) {
        ref1.current.value = ''
      } else if (index === 2) {
        ref2.current.value = ''
      }

      setLoading(false)
    }
  }
  const delIcon = (index: number) => {
    Modal.confirm({
      title: '确定要删除当前ICON吗',
      onOk: () => {
        if (index === 0) {
          setPath('')
        } else if (index === 1) {
          setPath1('')
        } else if (index === 2) {
          setPath2('')
        }
        const newData = [filePath, filePath1, filePath2]
        newData[index] = ''
        const val = newData.join(',')
        submitVal({ keyname: 'iconUrl', val: val })
      }
    })
  }
  return (
    <Space>
    <div className='full-width'>
      <input type="file" accept="image/png" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e, 0)}/>
      <p className='font-20'>普通ICON上传</p>
      <Spin spinning={loading}>
        <div className='full-width flex-row flex-jst-start flex-ali-center flex-wrap'>
          {
            filePath
              ? (
              <div className={`${styles.uploadOut} ${styles.showImg} flex-col flex-jst-center flex-ali-center`}>
                <img src={filePath} alt="" className={`${styles.imgResult}`}/>
                <div className={`${styles.delBtn}`}>
                  <Button type='primary' size='small' danger shape='circle' icon={<CloseOutlined />} onClick={() => delIcon(0)}></Button>
                </div>
              </div>
                )
              : (
              <div className={`${styles.uploadOut} ${styles.ctrl} flex-col flex-jst-center flex-ali-center`}>
                <Button type='primary' shape='circle' icon={<PlusOutlined />} size='large' onClick={() => {
                  ref.current!.click()
                }}></Button>
                <div className='text-grey font-12'>上传格式：png</div>
                <div className='text-grey font-12'>像素大小：512 * 512</div>
                <div className='text-grey font-12'>文件大小：小于2M</div>
              </div>
                )
          }
        </div>
      </Spin>
    </div>
    <div className='full-width'>
      <input type="file" accept="image/png" ref={ref1} style={{ display: 'none' }} onChange={e => uploadHandler(e, 1)}/>
      <p className='font-20'>背景图</p>
      <Spin spinning={loading}>
        <div className='full-width flex-row flex-jst-start flex-ali-center flex-wrap'>
          {
            filePath1
              ? (
              <div className={`${styles.uploadOut} ${styles.showImg} flex-col flex-jst-center flex-ali-center`}>
                <img src={filePath1} alt="" className={`${styles.imgResult}`}/>
                <div className={`${styles.delBtn}`}>
                  <Button type='primary' size='small' danger shape='circle' icon={<CloseOutlined />} onClick={() => delIcon(1)}></Button>
                </div>
              </div>
                )
              : (
              <div className={`${styles.uploadOut} ${styles.ctrl} flex-col flex-jst-center flex-ali-center`}>
                <Button type='primary' shape='circle' icon={<PlusOutlined />} size='large' onClick={() => {
                  ref1.current!.click()
                }}></Button>
                <div className='text-grey font-12'>上传格式：png</div>
                <div className='text-grey font-12'>像素大小：512 * 512</div>
                <div className='text-grey font-12'>文件大小：小于2M</div>
              </div>
                )
          }
        </div>
      </Spin>
    </div>
    <div className='full-width'>
      <input type="file" accept="image/png" ref={ref2} style={{ display: 'none' }} onChange={e => uploadHandler(e, 2)}/>
      <p className='font-20'>前景图</p>
      <Spin spinning={loading}>
        <div className='full-width flex-row flex-jst-start flex-ali-center flex-wrap'>
          {
            filePath2
              ? (
              <div className={`${styles.uploadOut} ${styles.showImg} flex-col flex-jst-center flex-ali-center`}>
                <img src={filePath2} alt="" className={`${styles.imgResult}`}/>
                <div className={`${styles.delBtn}`}>
                  <Button type='primary' size='small' danger shape='circle' icon={<CloseOutlined />} onClick={() => delIcon(2)}></Button>
                </div>
              </div>
                )
              : (
              <div className={`${styles.uploadOut} ${styles.ctrl} flex-col flex-jst-center flex-ali-center`}>
                <Button type='primary' shape='circle' icon={<PlusOutlined />} size='large' onClick={() => {
                  ref2.current!.click()
                }}></Button>
                <div className='text-grey font-12'>上传格式：png</div>
                <div className='text-grey font-12'>像素大小：512 * 512</div>
                <div className='text-grey font-12'>文件大小：小于2M</div>
                <div className='text-grey font-12'>推荐小于264 * 264，最大不能超过 288 * 288</div>
              </div>
                )
          }
        </div>
      </Spin>
    </div>
    </Space>

  )
}

export default IconConfig
