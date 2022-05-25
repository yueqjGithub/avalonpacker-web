import { Spin } from 'antd'
import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Context } from '../../store/context'
import { didShowThisMenu } from '../../utils/utils'

const WaitRoute = () => {
  const { state } = useContext(Context)
  const { routeList } = state
  const history = useHistory()
  useEffect(() => {
    const to = routeList.find(item => didShowThisMenu({ state, moduleName: item.menuName! }))?.path
    history.push(to || '/404')
  })
  return (
    <div className='full-width full-height flex-row flex-jst-center flex-ali-center'>
      <Spin spinning={true}></Spin>
    </div>
  )
}

export default WaitRoute
