'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  FileText,
  X,
  MessageSquare
} from 'lucide-react'
import { formatDateTime, formatTime } from '@/lib/utils'

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'OTHER'
  location?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
  createdAt: Date
  updatedAt: Date
}

interface AppointmentDetailsModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
}

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado', 
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
}

const typeLabels = {
  MEETING: '🤝 Reunião Presencial',
  CALL: '📞 Ligação/Videoconferência', 
  PRESENTATION: '📊 Apresentação',
  OTHER: '📝 Outros Assuntos',
}

export function AppointmentDetailsModal({ 
  appointment, 
  isOpen, 
  onClose 
}: AppointmentDetailsModalProps) {
  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Detalhes da Reunião
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Informações completas do agendamento
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Status e Título */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{appointment.title}</h2>
                <Badge className={`${statusColors[appointment.status]} px-3 py-1`}>
                  {statusLabels[appointment.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-lg text-gray-600">
                <span>{typeLabels[appointment.type]}</span>
              </div>
            </div>

            {/* Informações de Data e Hora */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Data</p>
                      <p className="text-blue-700">{formatDateTime(appointment.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Horário</p>
                      <p className="text-blue-700">
                        {formatTime(appointment.startTime)} às {formatTime(appointment.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
                {appointment.location && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-blue-200">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Local</p>
                      <p className="text-blue-700">{appointment.location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Cliente */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-green-800">Nome</p>
                    <p className="text-green-700">{appointment.clientName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Email</p>
                    <p className="text-green-700">{appointment.clientEmail}</p>
                  </div>
                  {appointment.clientPhone && (
                    <div>
                      <p className="font-medium text-green-800">Telefone</p>
                      <p className="text-green-700">{appointment.clientPhone}</p>
                    </div>
                  )}
                  {appointment.clientCompany && (
                    <div>
                      <p className="font-medium text-green-800">Empresa</p>
                      <p className="text-green-700">{appointment.clientCompany}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Descrição/Assunto */}
            {appointment.description && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Assunto da Reunião
                  </h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed">{appointment.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações de Sistema */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Criado em</p>
                    <p className="text-gray-700">{formatDateTime(appointment.createdAt)}</p>
                  </div>
                  {appointment.updatedAt && (
                    <div>
                      <p className="font-medium text-gray-600">Última atualização</p>
                      <p className="text-gray-700">{formatDateTime(appointment.updatedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-600">ID do Agendamento</p>
                    <p className="text-gray-700 font-mono text-xs">{appointment.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de Fechar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose} className="px-8">
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
