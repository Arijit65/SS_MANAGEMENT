import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // in milliseconds, 0 = no auto-dismiss
}

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = {
  toasts: [],
}

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      state.toasts.push({
        id,
        duration: 5000, // default 5 seconds
        ...action.payload,
      })
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    clearAllToasts: (state) => {
      state.toasts = []
    },
  },
})

export const { addToast, removeToast, clearAllToasts } = toastSlice.actions

// Helper functions for common toast types
export const showSuccessToast = (title: string, message?: string) =>
  addToast({ type: 'success', title, message })

export const showErrorToast = (title: string, message?: string) =>
  addToast({ type: 'error', title, message, duration: 7000 })

export const showWarningToast = (title: string, message?: string) =>
  addToast({ type: 'warning', title, message })

export const showInfoToast = (title: string, message?: string) =>
  addToast({ type: 'info', title, message })

export default toastSlice.reducer
