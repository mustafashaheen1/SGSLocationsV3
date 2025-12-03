'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PropertyCalendarEvent, CalendarEventType, supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent extends BigCalendarEvent {
  id: string;
  event_type: CalendarEventType;
  description?: string | null;
  all_day?: boolean;
  color?: string | null;
}

interface PropertyCalendarProps {
  propertyId: string;
}

const EVENT_COLORS = {
  production: '#e11921',      // Red - Production shoots
  director_scout: '#3b82f6',  // Blue - Director/Scout
  blocked: '#6b7280',         // Gray - Blocked dates
};

const EVENT_TYPE_LABELS = {
  production: 'Production',
  director_scout: 'Director/Scout',
  blocked: 'Blocked',
};

export default function PropertyCalendar({ propertyId }: PropertyCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    event_type: 'production' as CalendarEventType,
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
  });

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    };
  };

  const fetchEvents = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/properties/${propertyId}/calendar`, {
        headers,
      });
      const data = await response.json();

      if (data.events) {
        const calendarEvents: CalendarEvent[] = data.events.map((event: PropertyCalendarEvent) => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_date),
          end: new Date(event.end_date),
          event_type: event.event_type,
          description: event.description,
          all_day: event.all_day,
          color: event.color || EVENT_COLORS[event.event_type],
        }));
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      alert('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setFormData({
      event_type: 'production',
      title: '',
      description: '',
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      all_day: false,
    });
    setSelectedEvent(null);
    setIsEditing(false);
    setShowEventModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      event_type: event.event_type,
      title: event.title as string,
      description: event.description || '',
      start_date: (event.start as Date).toISOString(),
      end_date: (event.end as Date).toISOString(),
      all_day: event.all_day || false,
    });
    setIsEditing(true);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const headers = await getAuthHeaders();

      if (isEditing && selectedEvent) {
        // Update existing event
        const response = await fetch(`/api/properties/${propertyId}/calendar`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            event_id: selectedEvent.id,
            ...formData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update event');
        }
      } else {
        // Create new event
        const response = await fetch(`/api/properties/${propertyId}/calendar`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to create event');
        }
      }

      await fetchEvents();
      setShowEventModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/properties/${propertyId}/calendar?event_id=${selectedEvent.id}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      setShowEventModal(false);
      resetForm();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      event_type: 'production',
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      all_day: false,
    });
    setSelectedEvent(null);
    setIsEditing(false);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || EVENT_COLORS[event.event_type],
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.production }}></div>
          <span className="text-sm font-medium">Production</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.director_scout }}></div>
          <span className="text-sm font-medium">Director/Scout</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.blocked }}></div>
          <span className="text-sm font-medium">Blocked</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
        />
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditing ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as CalendarEventType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11921]"
                >
                  <option value="production">Production</option>
                  <option value="director_scout">Director/Scout</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11921]"
                  placeholder="Enter event title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11921]"
                  placeholder="Enter event description"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value + 'T00:00:00').toISOString() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11921]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value + 'T23:59:59').toISOString() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11921]"
                />
              </div>

              {/* All Day */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  className="w-4 h-4 text-[#e11921] border-gray-300 rounded focus:ring-[#e11921]"
                />
                <label htmlFor="all_day" className="ml-2 text-sm text-gray-700">
                  All day event
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                {isEditing && (
                  <button
                    onClick={handleDeleteEvent}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-2 bg-[#e11921] text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
