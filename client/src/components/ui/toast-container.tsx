import { useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { removeToast, type Toast, type ToastType } from '../../store/slices/toastSlice'

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; bgColor: string; borderColor: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch()
  const config = toastConfig[toast.type]
  const Icon = config.icon

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id))
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [dispatch, toast.id, toast.duration])

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${config.bgColor} ${config.borderColor}
        animate-in slide-in-from-right-full duration-300
        max-w-sm w-full
      `}
      role="alert"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
