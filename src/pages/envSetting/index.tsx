import React, { useContext } from 'react'
import PageContainer from '../../components/pageContainer'
import { Context } from '../../store/context'
import Main from './main'
const EnvSettign = () => {
  const { state, dispatch } = useContext(Context)
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[{ id: 'envlist' }]}
    >
      <Main state={state} dispatch={dispatch}></Main>
    </PageContainer>
  )
}

export default EnvSettign
