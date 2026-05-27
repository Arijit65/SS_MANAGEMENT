import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import usersReducer from './slices/usersSlice'
import customTablesReducer from './slices/customTablesSlice'
import dynamicDataReducer from './slices/dynamicDataSlice'
import toastReducer from './slices/toastSlice'
import projectReducer from './slices/projectSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    customTables: customTablesReducer,
    dynamicData: dynamicDataReducer,
    toast: toastReducer,
    projects: projectReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
