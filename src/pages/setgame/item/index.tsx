import { MobileOutlined } from '@ant-design/icons'
import { Button, message, Modal } from 'antd'
import React from 'react'
import { PermissionHoc } from '../../../components/permissionHOC'
import { httpApi } from '../../../service/axios'
import { ApiIdForSDK } from '../../../service/urls'
import { State } from '../../../store/state'
import { AppDataRow } from '../common'
import styles from '../styles.module.scss'

type Props = {
  target: AppDataRow
  state: State
  freshHandler: Function
  updateApp: Function
  openDetail: Function
  setCurrentGame: Function
  permissionList: PermissionList
}
const apiId: ApiIdForSDK = 'gamelist'
const AppItem = ({ target, state, freshHandler, updateApp, openDetail, setCurrentGame, permissionList }: Props) => {
  const deleteApp = (target:AppDataRow) => {
    Modal.confirm({
      content: `确定要删除${target.appName}吗?`,
      onOk: async () => {
        try {
          const res = await httpApi({
            state,
            method: 'DELETE',
            targetId: target.id,
            apiId,
            httpCustomConfig: {
              headers: {
                actionName: encodeURIComponent('删除')
              }
            }
          }).request
          if (res.data.status === 0) {
            message.success('已删除')
            freshHandler()
          } else {
            message.error(res.data.message || res.data.err_message)
          }
        } catch {
          message.error('程序出错')
        }
      }
    })
  }
  return (
    <div className={`${styles.CtlItem}`}>
      <div className={`${styles.CtlContent} flex-row flex-jst-btw flex-ali-start cursor-pointer`}>
        <div onClick={() => setCurrentGame(target)} className={`${styles.itemIcon} font-30 font-bold text-white flex-row flex-jst-center flex-ali-center`}>
          {target.appName.substring(0, 1)}
        </div>
        <div className={`full-height flex-1 flex-col flex-jst-btw flex-ali-start ${styles.infoContainer}`}>
          <div className='full-width'>
            <div className='full-width flex-col flex-jst-start flex-ali-start'>
              <p>APPID：{target.appId}</p>
              <p>应用名称：{target.appName}</p>
              <p>version：{target.versionCode}</p>
            </div>
            <div className='flex-row flex-jst-start flex-ali-center'>
              <p>屏幕方向：</p>
              {target.screenOrientation === 'portrait' ? <MobileOutlined style={{ color: '#40a9ff', fontSize: 20 }} /> : <MobileOutlined style={{ transform: 'rotate(90deg)', color: '#40a9ff', fontSize: 20, transformOrigin: 'center center' }}/>}
            </div>
          </div>
          {/* 按钮组 */}
          <div className='full-width flex-row flex-jst-end flex-ali-center'>
            <Button type="primary" size='small' onClick={() => setCurrentGame(target)}>选择游戏</Button>
            <Button type="primary" size='small' onClick={() => openDetail(target)} style={{ marginLeft: 5 }}>签名信息</Button>
            <PermissionHoc
              component={<Button type="primary" size='small' style={{ margin: '0 5px' }} onClick={() => updateApp(target)}>修改</Button>}
              permission={permissionList.u}
            ></PermissionHoc>
            <PermissionHoc
            permission={permissionList.d}
            component={<Button danger size="small" onClick={() => deleteApp(target)}>删除</Button>}
            ></PermissionHoc>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppItem
