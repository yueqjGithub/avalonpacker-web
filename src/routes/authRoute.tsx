import React from 'react'
import { Route, Redirect, withRouter } from 'react-router'
import MainLayout from '../layout/MainLayout'
import { State } from '../store/state'
import { useLocation } from 'react-router-dom'

type Props = {
  state: State
  dispatch: any,
  location: Location
}

const LayoutUse = ({ targetRouterConfig, state, dispatch }) => {
  return targetRouterConfig && targetRouterConfig.hideLayout
    ? (
    <targetRouterConfig.component dispatch={dispatch} state={state} />
      )
    : (
    <MainLayout state={state} dispatch={dispatch} isDependRoute={targetRouterConfig.dependGame}>
      {targetRouterConfig! && <targetRouterConfig.component dispatch={dispatch} state={state} />}
    </MainLayout>
      )
}

/** 根据路由auth属性判断是否需要权限验证，若需要则根据权限集合PermissionRoutes判断是否渲染 */
const PermissionCheck = ({ targetRouterConfig, PermissionRoutes, pathname, state, dispatch }) => {
  return targetRouterConfig && PermissionRoutes.find(item => item.moduleName === targetRouterConfig.menuName)
    ? (
    <Route path={pathname} render={() => {
      return (
        <LayoutUse targetRouterConfig={targetRouterConfig} dispatch={dispatch} state={state} />
      )
    }} />
      )
    : (
    <Redirect to='/404' />
      )
}

const AuthRoute = (props: Props) => {
  const { state, dispatch } = props
  const { currentGame, currentProjectInstance } = state
  const location = useLocation()
  const pathname = location.pathname
  const { user, routeList } = state
  /** 遍历出当前实例下的可用权限集 */
  const PermissionRoutes = React.useMemo(() => user.resourceInfo && user.resourceInfo.filter(item => item.projectInstanceId === currentProjectInstance.id) || [], [])
  /** 根据pathname从拍平的路由集合里面找出对应路由 */
  const targetRouterConfig = routeList.find((item: RouteSingle) => item.path === pathname)
  if (targetRouterConfig?.dependGame) {
    if (!currentGame) {
      dispatch({ type: 'SET_DATA', id: 'beforeRouter', value: pathname })
      return <Redirect to='/setGame'/>
    }
  }

  if (targetRouterConfig && !targetRouterConfig.redirect) {
    return targetRouterConfig.auth
      ? (
      <PermissionCheck PermissionRoutes={PermissionRoutes} targetRouterConfig={targetRouterConfig} pathname={pathname} dispatch={dispatch} state={state} />
        )
      : (
      <Route path={pathname} render={() => {
        return (
          <LayoutUse targetRouterConfig={targetRouterConfig} dispatch={dispatch} state={state}/>
        )
      }} />
        )
  } else if (targetRouterConfig?.redirect) {
    return <Redirect to={targetRouterConfig?.redirect} />
  } else {
    // 如果路由不合法，重定向到 404 页面
    return <Redirect to='/404' />
  }
}

export default withRouter((AuthRoute as any))
