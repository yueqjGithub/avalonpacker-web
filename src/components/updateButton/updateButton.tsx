import { EditOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { ButtonProps } from 'antd/es/button'
import * as React from 'react'

/** 更新按钮 */
export function UpdateButton (props: ButtonProps) {
  return (
        <Button icon={<EditOutlined />} {...props}>
            更新
        </Button>
  )
}
