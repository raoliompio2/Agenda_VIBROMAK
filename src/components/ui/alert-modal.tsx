'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, X } from 'lucide-react'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string | React.ReactNode
  type?: 'warning' | 'error' | 'info' | 'success'
  confirmText?: string
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  confirmText = 'Entendi'
}: AlertModalProps) {
  if (!isOpen) return null

  const colors = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      title: 'text-yellow-900',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      title: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'text-blue-900',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      title: 'text-green-900',
      button: 'bg-green-600 hover:bg-green-700 text-white'
    }
  }

  const colorScheme = colors[type]

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md animate-in fade-in zoom-in duration-200">
          <Card className={`${colorScheme.border} ${colorScheme.bg} border-2 shadow-2xl`}>
            <CardHeader className="relative pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 h-12 w-12 rounded-full ${colorScheme.iconBg} flex items-center justify-center`}>
                  <AlertTriangle className={`h-6 w-6 ${colorScheme.icon}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className={`text-xl font-bold ${colorScheme.title}`}>
                    {title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-gray-700">
                {typeof message === 'string' ? (
                  message.split('\n').map((line, index) => (
                    <p key={index} className={index > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))
                ) : (
                  message
                )}
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={onClose}
                  className={colorScheme.button}
                  size="lg"
                >
                  {confirmText}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

// Hook para facilitar o uso
export function useAlertModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    message: string | React.ReactNode
    type: 'warning' | 'error' | 'info' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  })

  const showAlert = (
    title: string, 
    message: string | React.ReactNode, 
    type: 'warning' | 'error' | 'info' | 'success' = 'warning'
  ) => {
    setModalState({ isOpen: true, title, message, type })
  }

  const closeAlert = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const AlertModalComponent = () => (
    <AlertModal
      isOpen={modalState.isOpen}
      onClose={closeAlert}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
    />
  )

  return { showAlert, closeAlert, AlertModal: AlertModalComponent }
}

// Para compatibilidade com useState
import { useState } from 'react'

