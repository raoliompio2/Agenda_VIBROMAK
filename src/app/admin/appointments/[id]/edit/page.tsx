'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarPicker } from '@/components/calendar/CalendarPicker'
import { TimeSlotPicker } from '@/components/calendar/TimeSlotPicker'
import { useToast } from '@/components/ui/alert-toast'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'PARTICULAR' | 'VIAGEM' | 'OTHER'
  location?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
}

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const { showToast, Toast } = useToast()
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [conflicts, setConflicts] = useState<any[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MEETING' as Appointment['type'],
    location: '',
    selectedDate: new Date(),
    selectedTime: new Date(),
    duration: 60
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/admin/login')
      return
    }
    if (params.id) {
      fetchAppointment()
    }
  }, [session, status, params.id])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`)
      if (!response.ok) {
        throw new Error('Agendamento não encontrado')
      }
      
      const data = await response.json()
      const apt = data.appointment
      
      // Convert dates
      apt.startTime = new Date(apt.startTime)
      apt.endTime = new Date(apt.endTime)
      
      setAppointment(apt)
      
      // Initialize form data
      setFormData({
        title: apt.title,
        description: apt.description || '',
        type: apt.type,
        location: apt.location || '',
        selectedDate: apt.startTime,
        selectedTime: apt.startTime,
        duration: apt.duration
      })
      
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error)
      showToast({
        type: 'error',
        title: 'Erro ao Carregar',
        message: 'Não foi possível carregar o agendamento.',
        duration: 5000
      })
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const checkConflicts = async (startTime: Date, endTime: Date) => {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      
      const conflicts = data.appointments.filter((apt: any) => {
        if (apt.id === params.id) return false // Ignore próprio agendamento
        if (!['PENDING', 'CONFIRMED'].includes(apt.status)) return false
        
        const aptStart = new Date(apt.startTime)
        const aptEnd = new Date(apt.endTime)
        
        // Verificar sobreposição
        return (startTime < aptEnd && endTime > aptStart)
      })
      
      setConflicts(conflicts)
      return conflicts.length === 0
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error)
      return false
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }
    
    if (!formData.selectedTime) {
      newErrors.selectedTime = 'Horário é obrigatório'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    
    try {
      const endTime = new Date(formData.selectedTime.getTime() + formData.duration * 60000)
      
      // Verificar conflitos antes de salvar
      const hasConflicts = !(await checkConflicts(formData.selectedTime, endTime))
      if (hasConflicts && conflicts.length > 0) {
        showToast({
          type: 'error',
          title: 'Conflito de Horário',
          message: `Já existe um agendamento no horário selecionado: ${conflicts[0].title}`,
          duration: 8000
        })
        setSaving(false)
        return
      }
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime: formData.selectedTime.toISOString(),
        endTime: endTime.toISOString(),
        type: formData.type
      }
      
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.conflictingAppointment) {
          showToast({
            type: 'error',
            title: 'Conflito de Horário',
            message: `Já existe um agendamento confirmado: ${errorData.conflictingAppointment.title} (${formatDateTime(new Date(errorData.conflictingAppointment.startTime))})`,
            duration: 8000
          })
        } else {
          throw new Error(errorData.error || 'Erro ao salvar')
        }
        return
      }
      
      showToast({
        type: 'success',
        title: 'Agendamento Atualizado!',
        message: 'As alterações foram salvas com sucesso.',
        duration: 5000
      })
      
      router.push('/admin')
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast({
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar as alterações.',
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!session || !appointment) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Agendamento</h1>
            <p className="text-gray-600">Cliente: {appointment.clientName}</p>
          </div>
        </div>

        {/* Conflitos Warning */}
        {conflicts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Conflito de Horário Detectado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflicts.map((conflict: any) => (
                  <div key={conflict.id} className="text-red-700">
                    <strong>{conflict.title}</strong> - {formatDateTime(new Date(conflict.startTime))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Reunião</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Reunião</Label>
                  <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEETING">🤝 Reunião Presencial</SelectItem>
                      <SelectItem value="CALL">📞 Ligação/Videochamada</SelectItem>
                      <SelectItem value="PRESENTATION">📊 Apresentação</SelectItem>
                      {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SECRETARY') && (
                        <>
                          <SelectItem value="PARTICULAR">🔒 Compromisso Particular</SelectItem>
                          <SelectItem value="VIAGEM">✈️ Viagem</SelectItem>
                        </>
                      )}
                      <SelectItem value="OTHER">📝 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duração</Label>
                  <Select 
                    value={formData.duration.toString()} 
                    onValueChange={(value) => updateFormData('duration', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="180">3 horas</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="300">5 horas</SelectItem>
                      <SelectItem value="360">6 horas</SelectItem>
                      <SelectItem value="420">Meio período (7h)</SelectItem>
                      <SelectItem value="480">Dia todo (8h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    placeholder="Local da reunião"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>

          {/* Calendário e Horários */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data e Horário</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarPicker
                  selectedDate={formData.selectedDate}
                  onDateSelect={(date) => {
                    updateFormData('selectedDate', date)
                    // Reset time when date changes
                    const newTime = new Date(date)
                    newTime.setHours(formData.selectedTime.getHours())
                    newTime.setMinutes(formData.selectedTime.getMinutes())
                    updateFormData('selectedTime', newTime)
                  }}
                  workingDays={[1, 2, 3, 4, 5]}
                />
                {errors.selectedTime && (
                  <p className="text-sm text-red-500 mt-2">{errors.selectedTime}</p>
                )}
              </CardContent>
            </Card>

            {formData.selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Horário</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeSlotPicker
                    selectedDate={formData.selectedDate}
                    selectedTime={formData.selectedTime}
                    onTimeSelect={(time) => updateFormData('selectedTime', time)}
                    workingHoursStart="09:00"
                    workingHoursEnd="18:00"
                    meetingDuration={formData.duration}
                    existingAppointments={[]} // Will be handled by conflict check
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {Toast}
    </div>
  )
}
