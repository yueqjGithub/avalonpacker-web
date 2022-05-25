import { CloseCircleFilled } from '@ant-design/icons'
import { Button, Empty, Spin } from 'antd'
import React from 'react'

type Props = {
  loadStatus: 'resolve' | 'reject' | 'empty'
  loading: boolean
  loadFunc: Function
  children: JSX.Element
  customEmpty?: JSX.Element | Element | React.ReactElement
}

const InnerStatusPage = ({ loadStatus, loading, loadFunc, children, customEmpty }: Props) => {
  const view = () => {
    switch (loadStatus) {
      case 'empty':
        return (
          <div>
            {
              customEmpty
                ? <>{customEmpty}</>
                : (
                <div className='full-width full-height flex-row flex-jst-center flex-ali-center'>
                  <Empty></Empty>
                </div>
                  )
            }
          </div>
        )
      case 'resolve':
        return (
          <>{children}</>
        )
      case 'reject':
        return (
          <div className='full-width full-height flex-col flex-jst-center flex-ali-center'>
            <CloseCircleFilled style={{ color: '#ff0000', fontSize: '44px', marginBottom: '10px' }}/>
            <span>加载失败</span>
            <Button onClick={() => loadFunc()}>重新请求</Button>
          </div>
        )
    }
  }
  return (
    <div className='full-width full-height'>
      <Spin spinning={loading} style={{ width: '100%', height: '100%' }}>
        {
          view()
        }
      </Spin>
    </div>
  )
}

export default InnerStatusPage
