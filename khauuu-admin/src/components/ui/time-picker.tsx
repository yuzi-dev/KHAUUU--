'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock } from 'lucide-react'

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    is_closed: boolean
  }
}

interface TimePickerProps {
  label: string
  value: OpeningHours
  onChange: (hours: OpeningHours) => void
  className?: string
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

const TIME_OPTIONS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
]

export function TimePicker({
  label,
  value = {},
  onChange,
  className = ''
}: TimePickerProps) {
  const updateDayHours = (day: string, field: 'open' | 'close' | 'is_closed', newValue: string | boolean) => {
    const currentDayHours = value[day] || { open: '09:00', close: '21:00', is_closed: false }
    const updatedHours = {
      ...value,
      [day]: {
        ...currentDayHours,
        [field]: newValue
      }
    }
    onChange(updatedHours)
  }

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = value[sourceDay]
    if (!sourceHours) return

    const updatedHours = { ...value }
    DAYS.forEach(day => {
      updatedHours[day.key] = { ...sourceHours }
    })
    onChange(updatedHours)
  }

  const setCommonHours = (open: string, close: string) => {
    const updatedHours = { ...value }
    DAYS.forEach(day => {
      updatedHours[day.key] = {
        open,
        close,
        is_closed: false
      }
    })
    onChange(updatedHours)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {label}
        </Label>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCommonHours('09:00', '21:00')}
          >
            Set 9AM-9PM
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCommonHours('10:00', '22:00')}
          >
            Set 10AM-10PM
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Opening Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayHours = value[day.key] || { open: '09:00', close: '21:00', is_closed: false }
            
            return (
              <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20 text-sm font-medium">
                  {day.label}
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={dayHours.is_closed}
                    onCheckedChange={(checked) => 
                      updateDayHours(day.key, 'is_closed', checked as boolean)
                    }
                  />
                  <span className="text-sm text-gray-600">Closed</span>
                </div>

                {!dayHours.is_closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500">Open:</Label>
                      <Select
                        value={dayHours.open}
                        onValueChange={(time) => updateDayHours(day.key, 'open', time)}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500">Close:</Label>
                      <Select
                        value={dayHours.close}
                        onValueChange={(time) => updateDayHours(day.key, 'close', time)}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToAllDays(day.key)}
                  className="ml-auto text-xs"
                >
                  Copy to all
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}