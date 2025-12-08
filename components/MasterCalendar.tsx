'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEventType, supabase } from '@/lib/supabase';
import { MapPin, X } from 'lucide-react';

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

interface MasterCalendarEvent extends BigCalendarEvent {
  id: string;
  property_id: string;
  property_name: string;
  property_display_name: string;
  property_city: string;
  property_state: string;
  event_type: CalendarEventType;
  description?: string | null;
  all_day?: boolean;
  color?: string | null;
}

const EVENT_COLORS = {
  hold_days: '#f59e0b',       // Amber - Hold Days
  blackout_days: '#1f2937',   // Dark Gray - Blackout Days
  director_scout: '#3b82f6',  // Blue - Director Scout
  tech_scout: '#10b981',      // Green - Tech Scout
};

const EVENT_TYPE_LABELS = {
  hold_days: 'Hold Days',
  blackout_days: 'Blackout Days',
  director_scout: 'Director Scout',
  tech_scout: 'Tech Scout',
};

export default function MasterCalendar() {
  const [events, setEvents] = useState<MasterCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<MasterCalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [filterEventType, setFilterEventType] = useState<string>('all');

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
      const response = await fetch('/api/calendar/master', {
        headers,
      });
      const data = await response.json();

      if (data.events) {
        const calendarEvents: MasterCalendarEvent[] = data.events.map((event: any) => {
          const eventType = event.event_type as CalendarEventType;
          return {
            id: event.id,
            property_id: event.property_id,
            property_name: event.property_name,
            property_display_name: event.property_display_name,
            property_city: event.property_city,
            property_state: event.property_state,
            title: `${event.property_display_name || event.property_name} - ${event.title}`,
            start: new Date(event.start_date),
            end: new Date(event.end_date),
            event_type: eventType,
            description: event.description,
            all_day: event.all_day,
            color: event.color || EVENT_COLORS[eventType],
          };
        });
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      alert('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectEvent = (event: MasterCalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const eventStyleGetter = (event: MasterCalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || EVENT_COLORS[event.event_type],
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
      },
    };
  };

  // Filter events based on selected event type
  const filteredEvents = filterEventType === 'all'
    ? events
    : events.filter(e => e.event_type === filterEventType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading master calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Master Calendar - All Properties</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by type:</label>
          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11921]"
          >
            <option value="all">All Events</option>
            <option value="hold_days">Hold Days Only</option>
            <option value="blackout_days">Blackout Days Only</option>
            <option value="director_scout">Director Scout Only</option>
            <option value="tech_scout">Tech Scout Only</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Hold Days</p>
          <p className="text-2xl font-bold" style={{ color: EVENT_COLORS.hold_days }}>
            {events.filter(e => e.event_type === 'hold_days').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Blackout Days</p>
          <p className="text-2xl font-bold" style={{ color: EVENT_COLORS.blackout_days }}>
            {events.filter(e => e.event_type === 'blackout_days').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Director Scout</p>
          <p className="text-2xl font-bold" style={{ color: EVENT_COLORS.director_scout }}>
            {events.filter(e => e.event_type === 'director_scout').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Tech Scout</p>
          <p className="text-2xl font-bold" style={{ color: EVENT_COLORS.tech_scout }}>
            {events.filter(e => e.event_type === 'tech_scout').length}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.hold_days }}></div>
          <span className="text-sm font-medium">Hold Days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.blackout_days }}></div>
          <span className="text-sm font-medium">Blackout Days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.director_scout }}></div>
          <span className="text-sm font-medium">Director Scout</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.tech_scout }}></div>
          <span className="text-sm font-medium">Tech Scout</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month']}
          defaultView="month"
          toolbar={true}
          tooltipAccessor={(event: MasterCalendarEvent) => String(event.title)}
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Event Details</h2>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Property Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#e11921] mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedEvent.property_name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedEvent.property_city}, {selectedEvent.property_state}
                    </p>
                    <a
                      href={`/admin/properties/${selectedEvent.property_id}/edit`}
                      className="text-sm text-[#e11921] hover:underline mt-1 inline-block"
                    >
                      View property →
                    </a>
                  </div>
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedEvent.color || EVENT_COLORS[selectedEvent.event_type] }}
                  ></div>
                  <span className="font-medium">
                    {EVENT_TYPE_LABELS[selectedEvent.event_type]}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <p className="text-gray-900">{selectedEvent.title}</p>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{selectedEvent.description}</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <p className="text-gray-900">
                    {format(selectedEvent.start as Date, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <p className="text-gray-900">
                    {format(selectedEvent.end as Date, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <a
                  href={`/admin/properties/${selectedEvent.property_id}/edit?tab=calendar`}
                  className="flex-1 px-4 py-2 bg-[#e11921] text-white rounded-md hover:bg-red-700 text-center"
                >
                  Edit in Property Calendar
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
