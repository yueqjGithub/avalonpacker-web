import React from 'react'
import { State } from '../../store/state'
import { Menu } from 'antd'
import { useHistory } from 'react-router-dom'
import { didShowThisMenu } from '../../utils/utils'

import styles from './menu.module.scss'

type Props = {
    state: State,
    routeConfig: RouteSingle[],
    dispatch?: any,
    children?: Element | JSX.Element,
    [key: string]: any
}

type RouteMethod = (path: string) => void

/**
 * @description 处理路由为菜单的函数
 * @param list 路由list
 */
const filterRoutes = (state:State, list:RouteSingle[], routeHandler:RouteMethod) => {
  /** isMenu确定哪些是菜单路由 */
  const arr = list.filter(item => item.isMenu && !item.isCommon)
  const result = arr.map(item => {
    if (item.childrens) {
      const willShow = item.childrens.some(d => didShowThisMenu({ state, moduleName: d.menuName! }))
      return willShow
        ? {
            key: item.path,
            label: item.menuName,
            icon: item.icon,
            children: filterRoutes(state, item.childrens, routeHandler)
          }
        : ''
    } else {
      const willShow = !item.auth || didShowThisMenu({ state, moduleName: item.menuName! })
      return willShow ? { key: item.path, label: item.menuName, icon: null } : ''
    }
  })
  return result
}

const CusMenu = (props: Props) => {
  const menuTheme = 'dark'
  const { children, state, routeConfig } = props
  const history = useHistory()
  const { routeList } = state

  const defaultOpenKeys = React.useMemo(() => {
    return routeList.find(item => item.path === history.location.pathname)?.parent || ''
  }, [history.location.pathname])
  const selectedKeys = [history.location.pathname]

  const routeHandler = (path:string) => {
    history.push(path)
  }

  return (
        <div className={`scroll-bar ${styles.menuContainer}`}>
            {children && children}
            <Menu
                mode="inline"
                theme={menuTheme}
                defaultSelectedKeys={selectedKeys}
                defaultOpenKeys={[defaultOpenKeys]}
                onSelect={({ key }) => routeHandler(key)}
                items={filterRoutes(state, routeConfig, routeHandler)}
            >
            </Menu>
        </div>
  )
}

export default CusMenu
