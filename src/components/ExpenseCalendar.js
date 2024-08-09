import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useFinanceContext } from '../contexts/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DollarSign, TrendingUp, ArrowLeft, ArrowRight, Clock, User, Calendar as CalendarIcon } from 'lucide-react';

const localizer = momentLocalizer(moment);

const ExpenseCalendar = () => {
  const { expenses, formatCurrency, loading, error } = useFinanceContext();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (expenses) {
      const formattedEvents = expenses.map(expense => {
        const [hours, minutes] = (expense.time || '00:00').split(':').map(Number);
        const start = new Date(expense.date);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        return {
          id: expense.id,
          title: expense.description,
          start,
          end,
          allDay: !expense.time,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          paidTo: expense.paidTo,
          notes: expense.notes,
        };
      });
      setEvents(formattedEvents);
    }
  }, [expenses]);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFA500', '#FFD700', '#FF6347']
    });
  }, []);

  const handleNavigate = useCallback((newDate) => {
    setDate(newDate);
  }, []);

  const customDayPropGetter = useCallback(
    (date) => {
      const dayEvents = events.filter(event => moment(event.start).isSame(date, 'day'));
      const totalAmount = dayEvents.reduce((sum, event) => sum + parseFloat(event.amount), 0);
      
      let style = {};
      if (totalAmount > 0) {
        const intensity = Math.min(totalAmount / 1000, 1);
        style.backgroundColor = `rgba(255, 99, 71, ${intensity})`;
      }
      
      return { style };
    },
    [events]
  );

  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('PREV')}
          className="mr-2 p-2 bg-blue-500 text-white rounded-full"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('NEXT')}
          className="p-2 bg-blue-500 text-white rounded-full"
        >
          <ArrowRight size={20} />
        </motion.button>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{label}</h2>
      <div>
        {['month', 'week', 'day'].map((viewName) => (
          <motion.button
            key={viewName}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onView(viewName)}
            className={`ml-2 p-2 ${view === viewName ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'} rounded-lg`}
          >
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const EventComponent = ({ event, view }) => (
    <div className="text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded">
      <strong className="text-gray-800 dark:text-white">{event.title}</strong>
      <br />
      <span className="text-gray-600 dark:text-gray-300">{formatCurrency(event.amount, event.currency)}</span>
      {(view === 'day' || view === 'week') && !event.allDay && (
        <div className="text-gray-500 dark:text-gray-400">
          <Clock size={10} className="inline mr-1" />
          {moment(event.start).format('HH:mm')}
        </div>
      )}
    </div>
  );

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 relative"
    >
      <style>
        {`
          .rbc-off-range-bg {
            @apply bg-gray-100 dark:bg-gray-700;
          }
          .rbc-today {
            @apply bg-blue-100 dark:bg-blue-900;
          }
          .rbc-event {
            @apply bg-blue-500;
          }
          .rbc-event.rbc-selected {
            @apply bg-blue-600;
          }
          .rbc-day-bg + .rbc-day-bg,
          .rbc-month-row + .rbc-month-row,
          .rbc-header {
            @apply border-gray-200 dark:border-gray-600;
          }
          .rbc-header + .rbc-header,
          .rbc-day-bg + .rbc-day-bg,
          .rbc-time-content > * + * > * {
            @apply border-l-gray-200 dark:border-l-gray-600;
          }
          .rbc-time-content,
          .rbc-time-header-content {
            @apply border-gray-200 dark:border-gray-600;
          }
          .rbc-timeslot-group {
            @apply border-b-gray-200 dark:border-b-gray-600;
          }
          .rbc-current-time-indicator {
            @apply bg-blue-500;
          }
          .rbc-button-link {
            @apply text-gray-800 dark:text-white;
          }
          .rbc-show-more {
            @apply text-blue-500 dark:text-blue-300;
          }
          .rbc-month-view,
          .rbc-time-view,
          .rbc-agenda-view {
            @apply text-gray-800 dark:text-white;
          }
          .rbc-toolbar-label,
          .rbc-toolbar button,
          .rbc-time-content .rbc-time-gutter .rbc-timeslot-group,
          .rbc-time-content .rbc-time-column .rbc-timeslot-group,
          .rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td,
          .rbc-agenda-view table.rbc-agenda-table .rbc-agenda-time-cell {
            @apply text-gray-800 dark:text-white;
          }
          .rbc-day-bg,
          .rbc-date-cell {
            @apply text-gray-800 dark:text-white;
          }
          .rbc-toolbar button:active,
          .rbc-toolbar button.rbc-active {
            @apply bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white;
          }
          .rbc-toolbar button:hover {
            @apply bg-gray-200 dark:bg-gray-700;
          }
          .rbc-off-range {
            @apply text-gray-500 dark:text-gray-400;
          }
        `}
      </style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        dayPropGetter={customDayPropGetter}
        onNavigate={handleNavigate}
        onView={setView}
        view={view}
        date={date}
        components={{
          toolbar: CustomToolbar,
          event: (props) => <EventComponent {...props} view={view} />,
        }}
      />
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-2xl z-10"
          >
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">{selectedEvent.title}</h3>
            <p className="text-lg mb-2 flex items-center text-gray-700 dark:text-gray-300">
              <DollarSign className="mr-1" />
              {formatCurrency(selectedEvent.amount, selectedEvent.currency)}
            </p>
            <p className="text-md mb-2 flex items-center text-gray-600 dark:text-gray-400">
              <TrendingUp className="mr-1" />
              {selectedEvent.category}
            </p>
            <p className="text-md mb-2 flex items-center text-gray-600 dark:text-gray-400">
              <User className="mr-1" />
              Paid to: {selectedEvent.paidTo || 'N/A'}
            </p>
            <p className="text-sm mb-2 flex items-center text-gray-500 dark:text-gray-500">
              <CalendarIcon className="mr-1" />
              {moment(selectedEvent.start).format('MMMM D, YYYY')}
            </p>
            {!selectedEvent.allDay && (
              <p className="text-sm mb-2 flex items-center text-gray-500 dark:text-gray-500">
                <Clock className="mr-1" />
                {moment(selectedEvent.start).format('HH:mm')}
              </p>
            )}
            {selectedEvent.notes && (
              <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">Notes: {selectedEvent.notes}</p>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedEvent(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Close
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExpenseCalendar;