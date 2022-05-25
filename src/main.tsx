import React from 'react'
import ReactDOM from 'react-dom'
import './styles/global.scss'
import './styles/app.scss'
import './assets/iconfont/iconfont.css'
import App from './App'
import { ContextProvider } from './store/context'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import moment from 'moment'
import 'moment/dist/locale/zh-cn'
moment.locale('zh-cn')

ReactDOM.render(
  <ContextProvider>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </ContextProvider>,
  document.getElementById('content')
)
