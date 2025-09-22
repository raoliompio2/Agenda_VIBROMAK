'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, X } from 'lucide-react'

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  show: boolean
}

export function AlertToast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  show
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    setIsVisible(show)
    
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <AlertCircle className="h-5 w-5 text-blue-600" />
  }

  const styles = {
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right duration-300">
      <Card className={`${styles[type]} shadow-lg border-2`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
              )}
              <p className="text-sm leading-relaxed">{message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook para usar o toast facilmente
export function useToast() {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = (props: Omit<ToastProps, 'show' | 'onClose'>) => {
    setToast({
      ...props,
      show: true,
      onClose: () => setToast(null)
    })
  }

  const hideToast = () => {
    setToast(null)
  }

  return {
    toast,
    showToast,
    hideToast,
    Toast: toast ? <AlertToast {...toast} /> : null
  }
}

