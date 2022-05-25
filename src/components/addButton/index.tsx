import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { ButtonProps } from 'antd/es/button'
import * as React from 'react'

/** 新建按钮 */
export function AddButton (props: ButtonProps) {
  return (
        <Button icon={<PlusOutlined />} {...props}>
            新建
        </Button>
  )
}
