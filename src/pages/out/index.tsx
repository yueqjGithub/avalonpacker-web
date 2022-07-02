import React, { useContext } from 'react'
import PageContainer from '../../components/pageContainer'
import { Context } from '../../store/context'
import Main from './main'

const OutPage = () => {
  const { state, dispatch } = useContext(Context)
  const { currentGame } = state
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[
        { id: 'querySourceList', data: { appId: currentGame } },
        { id: 'channel' },
        { id: 'packrecord', data: { appId: currentGame } }
      ]}
    >
      <Main></Main>
    </PageContainer>
  )
}

export default OutPage