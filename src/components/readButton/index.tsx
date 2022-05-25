import { Button } from 'antd'
import { ButtonProps } from 'antd/es/button'
import * as React from 'react'

/** 搜索按钮 */
export function ReadButton (props: ButtonProps) {
  return (
        <Button type="primary" htmlType="submit" {...props}>
            搜索
        </Button>
  )
}
