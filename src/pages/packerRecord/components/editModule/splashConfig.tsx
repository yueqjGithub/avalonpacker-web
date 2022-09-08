import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, message, Modal, Spin } from 'antd'
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
  const [loading, setLoading] = useState<boolean>(false)
  const { data: gameList = [] } = getApiDataState<AppDataRow[]>({ apiId: 'gamelist', state })
  const [filePath, setPath] = useState<string[]>([])
  const testUpload = () => {
    ref.current!.click()
  }
  useEffect(() => {
    if (target?.splashUrl) {
      const list = target.splashUrl.split(',')
      setPath(list)
    }
  }, [target])
  const uploadHandler = async (e:ChangeEvent<HTMLInputElement>) => {
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
    fm.append('type', '2')
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
        const list = [...filePath]
        list.push(res.data)
        setPath(list)
        submitVal({ keyname: 'splashUrl', val: list.join(',') })
      } else {
        message.error(res.error_msg || res.message)
      }
    } catch (e) {
      message.error('上传出错')
    } finally {
      setLoading(false)
      ref.current.value = ''
    }
  }
  const delIcon = (idx: number) => {
    Modal.confirm({
      title: '确定要删除当前闪屏吗',
      onOk: () => {
        const list = [...filePath]
        list.splice(idx, 1)
        setPath(list)
        submitVal({ keyname: 'splashUrl', val: list.join(',') })
      }
    })
  }
  return (
    <div className='full-width'>
      <input type="file" accept="image/png" ref={ref} style={{ display: 'none' }} onChange={e => uploadHandler(e)}/>
      <p className='font-20'>闪屏上传</p>
      <Spin spinning={loading}>
        <div className='full-width flex-row flex-jst-start flex-ali-center flex-wrap'>
          {/* {
            filePath
              ? (
              <div className={`${styles.uploadOut} ${styles.showImg} flex-col flex-jst-center flex-ali-center`}>
                <img src={filePath} alt="" className={`${styles.imgResult}`}/>
                <div className={`${styles.delBtn}`}>
                  <Button type='primary' size='small' danger shape='circle' icon={<CloseOutlined />} onClick={delIcon}></Button>
                </div>
              </div>
                )
              : (
              <div className={`${styles.uploadOut} ${styles.ctrl} flex-col flex-jst-center flex-ali-center`}>
                <Button type='primary' shape='circle' icon={<PlusOutlined />} size='large' onClick={() => testUpload()}></Button>
                <div className='text-grey font-12'>上传格式：png</div>
                <div className='text-grey font-12'>大小限制：小于2M</div>
              </div>
                )
          } */}
          {
            filePath.map((item, idx) => {
              return (
                <div key={item} className={`${styles.uploadOut} ${styles.showImg} flex-col flex-jst-center flex-ali-center`}>
                  <img src={item} alt="" className={`${styles.imgResult}`}/>
                  <div className={`${styles.delBtn}`}>
                    <Button type='primary' size='small' danger shape='circle' icon={<CloseOutlined />} onClick={() => delIcon(idx)}></Button>
                  </div>
                </div>
              )
            })
          }
          <div className={`${styles.uploadOut} ${styles.ctrl} flex-col flex-jst-center flex-ali-center`}>
            <Button type='primary' shape='circle' icon={<PlusOutlined />} size='large' onClick={() => testUpload()}></Button>
            <div className='text-grey font-12'>上传格式：png</div>
            <div className='text-grey font-12'>大小限制：小于2M</div>
          </div>
        </div>
      </Spin>
    </div>
  )
}

export default IconConfig
