import React, { useContext } from 'react'
import PageContainer from '../../components/pageContainer'
import { Context } from '../../store/context'
import Main from './main'

const OutPage = () => {
  const { state, dispatch } = useContext(Context)
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[
        { id: 'iamuserlist', delHeaderAction: true }
      ]}
    >
      <Main></Main>
    </PageContainer>
  )
}

export default OutPage
