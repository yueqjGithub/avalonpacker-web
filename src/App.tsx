import React, { useContext, useEffect } from 'react'
import { dispatchIambarValue, initMenuState, startIambar, getIamUrlFromUrl } from 'avalon-iam-util-client'
import { Context } from './store/context'
import { HashRouter, Switch } from 'react-router-dom'
import AuthRoute from './routes/authRoute'

function App (props) {
  const { state, dispatch } = useContext(Context)
  const { iambarLoading } = state
  useEffect(() => {
    initMenuState({ dispatch })
    /** 环境变量.env文件内配置,.local为普通模，测试对应.env.test，公用变量都可以在对应文件内定义，通过import.meta.env进行暴露 */
    const iamUrl = getIamUrlFromUrl()
    startIambar({
      entry: `${iamUrl}/top/`,
      onIamBarStateChange: v => {
        dispatchIambarValue({ dispatch, value: v })
      }
    })
  }, [])
  // 应用初始从local中读取全局使用的游戏参数
  useEffect(() => {
    const localCur = window.localStorage.getItem('currentGame')
    if (localCur) {
      dispatch({ type: 'SET_DATA', id: 'currentGame', value: localCur })
    }
  }, [])
  return (
    iambarLoading
      ? <div />
      : (
        <div className='page'>
          <HashRouter>
            <Switch>
              <AuthRoute state={state} dispatch={dispatch} {...props}/>
            </Switch>
          </HashRouter>
        </div>
        )
  )
}

export default App
