import React from 'react'

type Props = {
  component: JSX.Element
  permission: boolean
}

/**
 * @description 根据权限控制组件显隐
 * @param component 组件
 * @param permission boolean
 * @returns JSX.Element
 */
function PermissionHoc ({ component, permission }: Props) {
  return permission ? component : <></>
}

export { PermissionHoc }
