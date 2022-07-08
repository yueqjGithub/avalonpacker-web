import type { State } from './state'

export type ActionType = {
    id: string,
    value: any,
    type: 'SET_DATA' | 'GET_DATA'
}

export function reducer (state: State, action:ActionType) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, [action.id]: action.value }
    case 'GET_DATA':
      return state[action.id] || null
    default:
      return state
  }
}
