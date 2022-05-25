import React, { Suspense } from 'react'
import { Button, Layout, Menu, MenuTheme } from 'antd'
import styles from './layout.module.scss'
import CusMenu from '../components/menu'
import { State } from '../store/state'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { routeConfig } from '../routes/routes'
import CurrentShow from '../components/currentShow'
import { useHistory } from 'react-router-dom'
import { didShowThisMenu } from '../utils/utils'
type Props = {
  state: State
  children: Element | JSX.Element,
  dispatch: any,
  isDependRoute: boolean
  [key: string]: any
}

const MainLayout = (props: Props) => {
  const menuTheme = import.meta.env.VITE_MENUTHEME as MenuTheme
  const { children, state, dispatch, isDependRoute } = props
  const [collapsed, setColl] = React.useState(false)
  const history = useHistory()
  const commonMenus = React.useMemo(() => {
    const result: RouteSingle[] = []
    routeConfig.filter(item => item.isCommon).forEach(item => {
      item.childrens && item.childrens.forEach(d => {
        if (!d.auth || didShowThisMenu({ state, moduleName: d.menuName! })) {
          result.push(d)
        }
      })
    })
    return result
  }, [isDependRoute])
  const selectedKeys = React.useMemo(() => {
    return commonMenus.find(item => item.path === history.location.pathname) ? [history.location.pathname] : undefined
  }, [history.location.pathname])
  const routeHandler = (path: string, e) => {
    e.stopPropagation()
    history.push(path)
  }
  return (
    <div className='page'>
      <Layout>
        <Layout.Header></Layout.Header>
        <Layout>
          {
            isDependRoute
              ? (
                <Layout.Sider collapsed={collapsed} style={{ padding: '0' }}>
                  <div style={{ height: 'calc(100vh - 104px)' }} className="scroll-bar flex-row flex-jst-start flex-ali-start">
                    <CusMenu state={state} routeConfig={routeConfig}>
                      <div className={`${styles.currentShow}`}>
                        <CurrentShow dispatch={dispatch} collapsed={collapsed} state={state}></CurrentShow>
                      </div>
                    </CusMenu>
                  </div>
                  <div className='flex-row flex-jst-center flex-ali-center'>
                    <Button type="text" onClick={() => setColl(e => !e)} style={{ marginBottom: 6, color: '#1890ff', fontSize: '16px' }} size="small">
                      {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
                    </Button>
                  </div>
                </Layout.Sider>
                )
              : (
                <Layout.Sider collapsed={isDependRoute} className='fMenuContainer'>
                  <div style={{ height: 'calc(100vh - 64px)' }} className="scroll-bar flex-row flex-jst-start flex-ali-start">
                    <Menu
                      style={{ height: '100%', background: '#032444' }}
                      mode='inline'
                      theme={menuTheme}
                      selectedKeys={selectedKeys}
                      onSelect={({ key, domEvent }) => routeHandler(key, domEvent)}
                    >
                      {
                        commonMenus.map(item => <Menu.Item key={item.path} icon={item.icon || <></>}>{item.menuName}</Menu.Item>)
                      }
                    </Menu>
                  </div>
                </Layout.Sider>
                )
          }
          <Layout.Content style={{ height: 'calc(100vh - 64px)', padding: '.2rem' }}>
            <Suspense fallback={<div>Loading...</div>}>
              <div className={`${styles.contentOut} scroll-bar`}>
                {children}
              </div>
            </Suspense>
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  )
}

export default MainLayout
