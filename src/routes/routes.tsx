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
        menuName: '游戏管理',
        icon: <i className='iconfont icon-app'></i>,
        component: SetGame
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
      }
    ]
  },
  {
    path: '/tools',
    menuName: '打包工具',
    auth: true,
    isMenu: true,
    icon: <ToolOutlined />,
    childrens: [
      {
        path: '/packerrecord',
        menuName: '出包工具',
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
