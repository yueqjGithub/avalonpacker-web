/* eslint-disable no-unused-vars */
declare type RouteSingle = {
  path: string,
  component?: any,
  auth?: boolean,
  isMenu?: boolean,
  menuName?: string,
  childrens?: RouteSingle[],
  icon?: any,
  hideLayout?:boolean,
  parent?:string,
  redirect?: string,
  dependGame?: boolean // 是否需要选择游戏
  isCommon?: boolean // 是否为公共模块，父菜单判断依据
}

declare type ResponseBase = {
  code: number,
  message?: string,
  success?: boolean,
  [key:string]: any
}

declare module ProjectTypesSource {
  interface CusMenuBase {
    /** 菜单的id,影响hash路由,菜单选中和打开的key值 */
    id: string
    /** 菜单的名称 */
    name: string,
    /** children */
    childrens?: CusMenuBase[]
  }
}

declare type PermissionList = {
  [key: string]: boolean
}
