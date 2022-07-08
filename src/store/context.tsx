import React from 'react'
import { reducer } from './reducer'
import initStates from './state'

const Context = React.createContext<{ state: typeof initStates, dispatch: any | undefined}>({
  state: initStates,
  dispatch: undefined
})

type Props = {
  children: React.ReactElement,
  [key: string]: any
}

const ContextProvider = (props: Props) => {
  const [state, dispatch] = React.useReducer(reducer, initStates)
  const { children } = props
  return (
    <Context.Provider value={{ state, dispatch }}>
      {children}
    </Context.Provider>
  )
}

export { ContextProvider, Context }
