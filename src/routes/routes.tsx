import React, { lazy } from 'react'
import { Result } from 'antd'
import SetGame from '../pages/setgame'
import { BuildOutlined, ToolOutlined } from '@ant-design/icons'
import WaitRoute from '../components/waitRoute'
export const routeConfig:RouteSingle[] = [
  {
    path: '/',
    auth: false,
    component: WaitRoute
  },
  {
    path: '/common',
    menuName: '公共配置',
    auth: true,
    isMenu: true,
    icon: <BuildOutlined />,
    isCommon: true,
    childrens: [
      {
        path: '/setGame',
        auth: false,
        isMenu: false,
        menuName: '应用管理',
        icon: <i className='iconfont icon-app'></i>,
        component: SetGame,
        parent: '/common'
      },
      {
        path: '/channel',
        menuName: '渠道配置',
        isMenu: true,
        auth: true,
        icon: <i className='iconfont icon-channel'></i>,
        component: lazy(() => import('../pages/channel')),
        parent: '/common'
      },
      {
        path: '/plugins',
        menuName: '插件配置',
        isMenu: true,
        auth: true,
        icon: <i className='iconfont icon-xitongmoxingchajian'></i>,
        component: lazy(() => import('../pages/plugins')),
        parent: '/common'
      },
      {
        path: '/mediaflag',
        menuName: '媒体标识',
        isMenu: true,
        auth: true,
        icon: <i className='iconfont icon-duomeiti-'></i>,
        component: lazy(() => import('../pages/mediaFlag')),
        parent: '/common'
      },
      {
        path: '/env',
        menuName: '环境配置',
        isMenu: true,
        auth: true,
        icon: <i className='iconfont icon-huanjingjiance'></i>,
        component: lazy(() => import('../pages/envSetting')),
        parent: '/common'
      }
    ]
  },
  {
    path: '/tools',
    menuName: '分包工具',
    auth: true,
    isMenu: true,
    icon: <ToolOutlined />,
    childrens: [
      {
        path: '/package',
        menuName: '分包工具',
        auth: false,
        isMenu: true,
        component: lazy(() => import('../pages/out')),
        parent: '/tools',
        dependGame: true
      },
      {
        path: '/packerrecord',
        menuName: '配置管理',
        isMenu: true,
        auth: true,
        component: lazy(() => import('../pages/packerRecord')),
        parent: '/tools',
        dependGame: true
      },
      {
        path: '/packhistory',
        menuName: '打包历史',
        isMenu: true,
        auth: false,
        parent: '/tools',
        dependGame: true,
        component: lazy(() => import('../pages/packHistory'))
      }
    ]
  },
  {
    path: '/404',
    component: () => {
      return (
        <Result
          status="404"
          title="404"
          subTitle="您无法访问到该页面"
        />
      )
    }
  }
]
