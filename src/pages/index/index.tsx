import { SmileOutlined } from '@ant-design/icons'
import { Result } from 'antd'
import React from 'react'

const IndexPage = (props: any) => {
  const { state } = props
  const sysName = import.meta.env.VITE_SYSNAME
  const uName = state.user.name
  return (
    <Result
      icon={<SmileOutlined />}
      title={`${uName},欢迎进入${sysName}`}
    />
  )
}

export default IndexPage
