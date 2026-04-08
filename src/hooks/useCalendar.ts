import { useState, useEffect, useCallback } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isWithinInterval, isBefore, startOfDay,
  addDays, subDays, addWeeks, subWeeks
} from 'date-fns';

interface NotesStore {
  [dateKey: string]: string;
}

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selection, setSelection] = useState<{start: Date | null, end: Date | null}>({ start: null, end: null });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [direction, setDirection] = useState(0);

  // Notes state
  const [notes, setNotes] = useState<NotesStore>({});
  const [monthlyNotes, setMonthlyNotes] = useState<NotesStore>({});
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [activeNoteDate, setActiveNoteDate] = useState<Date | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [tempMonthlyNote, setTempMonthlyNote] = useState("");

  const [mounted, setMounted] = useState(false);
  const [keyboardFocusDate, setKeyboardFocusDate] = useState<Date | null>(null);

  // Time-of-Day Ambient Engine state
  const [isNightMode, setIsNightMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Live Weather State
  const [liveWeatherCode, setLiveWeatherCode] = useState<number | null>(null);

  // Persistence
  useEffect(() => {
    setMounted(true);
    const savedNotes = localStorage.getItem('calendar_daily_notes');
    const savedMonthlyNotes = localStorage.getItem('calendar_monthly_notes');
    const savedSelection = localStorage.getItem('calendar_selection');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedMonthlyNotes) setMonthlyNotes(JSON.parse(savedMonthlyNotes));
    if (savedSelection) {
      const parsed = JSON.parse(savedSelection);
      setSelection({
        start: parsed.start ? new Date(parsed.start) : null,
        end: parsed.end ? new Date(parsed.end) : null
      });
    }

    // Determine ambient time (Night = 18:00 to 05:59)
    const currentHour = new Date().getHours();
    setIsNightMode(currentHour >= 18 || currentHour < 6);

    // Fetch Live Weather (Async)
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        setLiveWeatherCode(data.current_weather.weathercode);
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        (err) => fetchWeather(51.5074, -0.1278) // Fallback to London on Error/Denial
      );
    } else {
      fetchWeather(51.5074, -0.1278);
    }

  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('calendar_daily_notes', JSON.stringify(notes));
      localStorage.setItem('calendar_monthly_notes', JSON.stringify(monthlyNotes));
      localStorage.setItem('calendar_selection', JSON.stringify(selection));
    }
  }, [notes, monthlyNotes, selection, mounted]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const monthlyNoteKey = format(currentDate, 'yyyy-MM');

  const nextMonth = useCallback(() => {
    setDirection(1);
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);
  
  const prevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const handleDateClick = useCallback((day: Date) => {
    const dayStart = startOfDay(day);
    if (!selection.start || (selection.start && selection.end)) {
      setSelection({ start: dayStart, end: null });
    } else if (selection.start && !selection.end) {
      if (isBefore(dayStart, selection.start)) {
        setSelection({ start: dayStart, end: selection.start });
      } else {
        setSelection({ start: selection.start, end: dayStart });
      }
    }
    setKeyboardFocusDate(dayStart);
  }, [selection]);

  const clearSelection = useCallback(() => {
    setSelection({ start: null, end: null });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNotesPanelOpen || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }
      
      let nextFocus = keyboardFocusDate || startOfDay(new Date());

      switch(e.key) {
        case 'ArrowRight':
          nextFocus = addDays(nextFocus, 1);
          break;
        case 'ArrowLeft':
          nextFocus = subDays(nextFocus, 1);
          break;
        case 'ArrowDown':
          nextFocus = addWeeks(nextFocus, 1);
          break;
        case 'ArrowUp':
          nextFocus = subWeeks(nextFocus, 1);
          break;
        case 'Enter':
          e.preventDefault();
          handleDateClick(nextFocus);
          return;
        default:
          return;
      }

      e.preventDefault();
      setKeyboardFocusDate(nextFocus);
      setHoverDate(nextFocus); // Sync hover state with keyboard for ghost range
      
      // Auto-navigate months if focus goes out of bounds
      if (isBefore(nextFocus, startOfMonth(currentDate))) {
        prevMonth();
      } else if (isBefore(endOfMonth(currentDate), nextFocus)) {
        nextMonth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardFocusDate, currentDate, handleDateClick, isNotesPanelOpen, nextMonth, prevMonth]);


  // Notes logic
  const openNotesPanel = useCallback((day: Date) => {
    setActiveNoteDate(day);
    setTempNote(notes[format(day, 'yyyy-MM-dd')] || "");
    setIsNotesPanelOpen(true);
  }, [notes]);

  const saveDailyNote = useCallback(() => {
    if (!activeNoteDate) return;
    const dateKey = format(activeNoteDate, 'yyyy-MM-dd');
    setNotes(prev => {
      const updated = { ...prev };
      if (tempNote.trim() === "") {
        delete updated[dateKey];
      } else {
        updated[dateKey] = tempNote;
      }
      return updated;
    });
    setIsNotesPanelOpen(false);
  }, [activeNoteDate, tempNote]);

  const removeDailyNote = useCallback((dateKey: string) => {
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[dateKey];
      return updated;
    });
    // If the currently open panel is the one being deleted, close it
    if (activeNoteDate && format(activeNoteDate, 'yyyy-MM-dd') === dateKey) {
      setIsNotesPanelOpen(false);
    }
  }, [activeNoteDate]);

  // Drag and Drop Task Migration
  const moveDailyNote = useCallback((sourceDateKey: string, targetDateKey: string) => {
    if (sourceDateKey === targetDateKey) return;
    setNotes(prev => {
      const sourceContent = prev[sourceDateKey];
      if (!sourceContent) return prev; // Avoid moving nothing

      const updated = { ...prev };
      // If target has a note, optionally merge or overwrite. We will just overwrite/replace for pure migration.
      updated[targetDateKey] = sourceContent;
      delete updated[sourceDateKey];
      return updated;
    });
  }, []);

  const saveMonthlyNote = useCallback(() => {
    setMonthlyNotes(prev => ({
      ...prev,
      [monthlyNoteKey]: tempMonthlyNote
    }));
  }, [monthlyNoteKey, tempMonthlyNote]);

  useEffect(() => {
    setTempMonthlyNote(monthlyNotes[monthlyNoteKey] || "");
  }, [monthlyNoteKey, monthlyNotes]);

  return {
    mounted,
    currentDate,
    selection,
    hoverDate,
    direction,
    notes,
    isNotesPanelOpen,
    activeNoteDate,
    tempNote,
    tempMonthlyNote,
    calendarDays,
    monthStart,
    monthlyNoteKey,
    keyboardFocusDate,
    isNightMode,
    isMuted,
    liveWeatherCode,
    setCurrentDate,
    setIsNightMode,
    setIsMuted,
    nextMonth,
    prevMonth,
    handleDateClick,
    clearSelection,
    setHoverDate,
    setIsNotesPanelOpen,
    setTempNote,
    setTempMonthlyNote,
    openNotesPanel,
    saveDailyNote,
    removeDailyNote,
    moveDailyNote,
    saveMonthlyNote
  };
}
