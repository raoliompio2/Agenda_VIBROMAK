'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Users, Mail, UserCheck, UserX } from 'lucide-react'
import { validateEmail } from '@/lib/utils'

export interface Participant {
  id: string
  name: string
  email: string
  isOptional: boolean
}

interface ParticipantsManagerProps {
  participants: Participant[]
  onChange: (participants: Participant[]) => void
  disabled?: boolean
  maxParticipants?: number
}

export function ParticipantsManager({ 
  participants, 
  onChange, 
  disabled = false,
  maxParticipants = 20
}: ParticipantsManagerProps) {
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', isOptional: false })
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validateParticipant = () => {
    const newErrors: { name?: string; email?: string } = {}
    
    if (!newParticipant.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    
    if (!newParticipant.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(newParticipant.email)) {
      newErrors.email = 'Email inválido'
    } else if (participants.some(p => p.email.toLowerCase() === newParticipant.email.toLowerCase())) {
      newErrors.email = 'Este email já foi adicionado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addParticipant = () => {
    if (!validateParticipant()) return
    
    const participant: Participant = {
      id: Date.now().toString(),
      name: newParticipant.name.trim(),
      email: newParticipant.email.trim().toLowerCase(),
      isOptional: newParticipant.isOptional
    }

    onChange([...participants, participant])
    setNewParticipant({ name: '', email: '', isOptional: false })
    setErrors({})
  }

  const removeParticipant = (id: string) => {
    onChange(participants.filter(p => p.id !== id))
  }

  const toggleOptional = (id: string) => {
    onChange(participants.map(p => 
      p.id === id ? { ...p, isOptional: !p.isOptional } : p
    ))
  }

  const requiredCount = participants.filter(p => !p.isOptional).length
  const optionalCount = participants.filter(p => p.isOptional).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participantes da Reunião
          {participants.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {participants.length} participante{participants.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Estatísticas */}
        {participants.length > 0 && (
          <div className="flex gap-4 text-sm text-muted-foreground bg-slate-50 rounded p-3">
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span>{requiredCount} obrigatório{requiredCount !== 1 ? 's' : ''}</span>
            </div>
            {optionalCount > 0 && (
              <div className="flex items-center gap-1">
                <UserX className="h-4 w-4 text-amber-600" />
                <span>{optionalCount} opcional{optionalCount !== 1 ? 'is' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Lista de Participantes */}
        {participants.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {participants.map((participant, index) => (
              <div 
                key={participant.id}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg group hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{participant.name}</span>
                    <Badge 
                      variant={participant.isOptional ? "secondary" : "default"} 
                      className="text-xs"
                    >
                      {participant.isOptional ? 'Opcional' : 'Obrigatório'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{participant.email}</span>
                  </div>
                </div>
                
                {!disabled && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOptional(participant.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {participant.isOptional ? 
                        <UserCheck className="h-4 w-4 text-green-600" /> : 
                        <UserX className="h-4 w-4 text-amber-600" />
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(participant.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Adicionar Participante */}
        {!disabled && participants.length < maxParticipants && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <Label htmlFor="participantName" className="text-sm">Nome</Label>
                <Input
                  id="participantName"
                  placeholder="Nome do participante"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="participantEmail" className="text-sm">Email</Label>
                <Input
                  id="participantEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOptional"
                  checked={newParticipant.isOptional}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, isOptional: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isOptional" className="text-sm cursor-pointer">
                  Participação opcional
                </Label>
              </div>
              
              <Button
                type="button"
                onClick={addParticipant}
                size="sm"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        )}

        {/* Limite de participantes */}
        {participants.length >= maxParticipants && (
          <p className="text-sm text-amber-600 bg-amber-50 rounded p-2">
            ⚠️ Limite de {maxParticipants} participantes atingido
          </p>
        )}

        {/* Ajuda */}
        <div className="text-xs text-muted-foreground bg-blue-50 rounded p-2">
          <p className="font-medium text-blue-900 mb-1">💡 Dicas sobre participantes:</p>
          <ul className="space-y-1 text-blue-800">
            <li>• <strong>Obrigatórios:</strong> Pessoas essenciais para a reunião</li>
            <li>• <strong>Opcionais:</strong> Pessoas que podem participar se disponíveis</li>
            <li>• Todos receberão convite por email quando confirmado</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

