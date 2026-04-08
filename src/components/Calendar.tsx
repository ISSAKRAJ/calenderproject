import styles from './Calendar.module.css';
import { useEffect, useRef, useState } from 'react';
import { format, isSameMonth, isSameDay, isWithinInterval, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Clock, X, Check, Volume2, VolumeX, Sun, Moon, Trash2, Cloud, CloudRain, Snowflake, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastAverageColor } from 'fast-average-color';
import { useCalendar } from '@/hooks/useCalendar';
import { audioEngine } from '@/utils/audio';
import CommandPalette from './CommandPalette';
import LiveClock from './LiveClock';

const MONTH_IMAGES = [
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80', // Jan (Fixed)
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80', // Feb
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', // Mar (Fixed)
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80', // Apr
  'https://images.unsplash.com/photo-1496309732348-3627f3f040ee?w=800&q=80', // May
  'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=800&q=80', // Jun
  'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80', // Jul
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80', // Aug
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80', // Sep (Fixed)
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80', // Oct (Fixed)
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', // Nov (Fixed)
  'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=800&q=80'  // Dec
];

const MOTIVATIONS = [
  "A new year is a powerful 'Git Commit' for your life—make this version count.", 
  "Code is temporary; consistency is permanent.", 
  "Debug your habits, optimize your future.",
  "Spring logic: If you don't grow, you're just standing still.", 
  "Great things aren't built in a day; they are built in sprints.", 
  "The middle of the year is the perfect time to refactor your vision.",
  "Success is the sum of small efforts, repeated daily until they compile.", 
  "Grit is the compiler that turns raw dreams into reality.", 
  "Fall forward—every error is just a lesson in disguise.",
  "Harvest the efforts of the seeds you planted in the first quarter.", 
  "Gratitude is the cleanest syntax for a happy mind.", 
  "Close the loop. Finish strong, then prepare to restart fresh."
];

export default function Calendar() {
  const {
    mounted, currentDate, selection, hoverDate, direction, notes, isNotesPanelOpen, activeNoteDate, tempNote, tempMonthlyNote,
    calendarDays, monthStart, keyboardFocusDate, isNightMode, isMuted, liveWeatherCode,
    setCurrentDate, setIsNightMode, setIsMuted,
    nextMonth, prevMonth, handleDateClick, clearSelection, setHoverDate, setIsNotesPanelOpen, 
    setTempNote, setTempMonthlyNote, openNotesPanel, saveDailyNote, removeDailyNote, moveDailyNote, saveMonthlyNote
  } = useCalendar();

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag and drop local state
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    // Sync React state to the audio engine
    audioEngine.isMuted = isMuted;

    const fac = new FastAverageColor();
    const currentImage = MONTH_IMAGES[currentDate.getMonth()];
    
    fac.getColorAsync(currentImage, { algorithm: 'dominant' })
      .then(color => {
        if (containerRef.current) {
          containerRef.current.style.setProperty('--aura-accent', color.hex);
          containerRef.current.style.setProperty('--aura-glow', color.rgba.replace('1)', '0.3)'));
          containerRef.current.style.setProperty('--aura-ghost', color.rgba.replace('1)', '0.1)'));
        }
      })
      .catch(e => console.error(e));
  }, [currentDate, mounted, isMuted]);

  const currentMonthIndex = currentDate.getMonth();
  const currentImage = MONTH_IMAGES[currentMonthIndex];
  const currentMotivation = MOTIVATIONS[currentMonthIndex];

  // 3D Hinge flip variants
  const hingeVariants = {
    enter: (direction: number) => ({
      rotateX: direction > 0 ? -90 : 90,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      rotateX: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      rotateX: direction < 0 ? -90 : 90,
      opacity: 0,
    })
  };

  const navNext = () => {
    nextMonth();
    audioEngine.playThwip();
  };

  const navPrev = () => {
    prevMonth();
    audioEngine.playThwip();
  };

  const handleSaveNote = () => {
    saveDailyNote();
    audioEngine.playScratch();
  };

  const handleDeleteNote = () => {
    if (!activeNoteDate) return;
    setIsDeleting(true);
    // Let the peel animation run before dispatching the deletion state
    setTimeout(() => {
      removeDailyNote(format(activeNoteDate, 'yyyy-MM-dd'));
      setIsDeleting(false);
    }, 400); 
  };

  const jumpToMonth = (index: number) => {
    setCurrentDate(new Date(2026, index, 1));
    audioEngine.playThwip();
  };

  const renderWeatherIcon = () => {
    if (liveWeatherCode === null) return null;
    // Map Open-Meteo codes
    if (liveWeatherCode <= 3 && liveWeatherCode > 0) return <Cloud size={14} style={{position: 'absolute', top: -5, right: -10, color: '#888'}} />;
    if (liveWeatherCode === 0) return <Sun size={14} style={{position: 'absolute', top: -5, right: -10, color: '#FDB813'}} />;
    if (liveWeatherCode >= 51 && liveWeatherCode <= 67) return <CloudRain size={14} style={{position: 'absolute', top: -5, right: -10, color: '#4A90E2'}} />;
    if (liveWeatherCode >= 71 && liveWeatherCode <= 86) return <Snowflake size={14} style={{position: 'absolute', top: -5, right: -10, color: '#A0C4FF'}} />;
    return <Cloud size={14} style={{position: 'absolute', top: -5, right: -10, color: '#666'}} />; // Fallback
  };

  if (!mounted) return null;

  return (
    <div className={`${styles.calendarContainer} ${isNightMode ? styles.ambientNight : ''}`} ref={containerRef}>
      
      <CommandPalette 
        isOpen={isCmdOpen} setIsOpen={setIsCmdOpen}
        isNightMode={isNightMode} setIsNightMode={setIsNightMode}
        isMuted={isMuted} setIsMuted={setIsMuted}
        jumpToMonth={jumpToMonth}
      />

      {/* Absolute Header Controls (God-Tier Toggles) */}
      <div className={styles.headerControls}>
        <button 
          className={styles.headerIconBtn} 
          onClick={() => setIsMuted(audioEngine.toggleMute())}
          title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
        >
          {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
        </button>
        <button 
          className={styles.headerIconBtn} 
          onClick={() => setIsNightMode(!isNightMode)}
          title="Toggle Ambient Time Mode"
        >
          {isNightMode ? <Sun size={16}/> : <Moon size={16}/>}
        </button>
        <button 
          className={styles.headerIconBtn} 
          onClick={() => setIsCmdOpen(true)}
          title="Search / Command Palette (Cmd+K)"
        >
          <Search size={16}/>
        </button>
      </div>

      {/* TOP PANEL: HERO */}
      <div className={styles.heroPanelPerspective}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentDate.getTime()}
            custom={direction}
            variants={hingeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
            className={styles.heroPanel}
          >
            <div className={styles.heroBackground} style={{ backgroundImage: `url(${currentImage})` }} />
            <div className={styles.heroOverlay}>
              <div className={styles.heroHeader}>
                <h1 className={styles.heroMonth}>{format(currentDate, 'MMMM')}</h1>
                <p className={styles.heroYear}>{format(currentDate, 'yyyy')}</p>
              </div>
              <p className={styles.heroMotivation}><Clock size={16} /> {currentMotivation}</p>

              <div className={styles.monthlyNotesContainer}>
                <div className={styles.monthlyNotesHeader}>
                  <BookOpen size={16} /> Monthly Focus
                </div>
                <textarea
                  className={`${styles.monthlyNotesInput} ${styles.handwrittenText}`}
                  placeholder="What's the main goal this month?"
                  value={tempMonthlyNote}
                  onChange={(e) => setTempMonthlyNote(e.target.value)}
                  onBlur={saveMonthlyNote}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.spiralBinding}>
        {[...Array(16)].map((_, i) => (
          <div key={i} className={styles.spiralLoop} />
        ))}
      </div>

      <div className={styles.gridPanel}>
        <div className={styles.gridHeader}>
          <div className={styles.selectionActions}>
            {selection.start && (
              <button className={styles.clearBtn} onClick={clearSelection}>Clear Range</button>
            )}
          </div>
          <div className={styles.controls}>
            <button onClick={navPrev} className={styles.navBtn} aria-label="Previous Month"><ChevronLeft /></button>
            <button onClick={navNext} className={styles.navBtn} aria-label="Next Month"><ChevronRight /></button>
          </div>
        </div>

        <div className={styles.weekdays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.weekday}>{day}</div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isSelectedStart = selection.start && isSameDay(day, selection.start);
            const isSelectedEnd = selection.end && isSameDay(day, selection.end);
            const isSelected = isSelectedStart || isSelectedEnd || 
              (selection.start && selection.end && isWithinInterval(day, { start: selection.start, end: selection.end }));
            
            const isHoveredRange = selection.start && !selection.end && hoverDate && 
              ((isBefore(selection.start, hoverDate) && isWithinInterval(day, { start: selection.start, end: hoverDate })) ||
              (isBefore(hoverDate, selection.start) && isWithinInterval(day, { start: hoverDate, end: selection.start })));

            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const hasNote = !!notes[dateKey];
            const isFocused = keyboardFocusDate && isSameDay(day, keyboardFocusDate);
            const dropzoneActive = dragOverDate === dateKey;

            return (
              <div 
                key={dateKey} 
                className={`
                  ${styles.dayCell} 
                  ${!isCurrentMonth ? styles.dimmedDay : ''} 
                  ${isSelected ? styles.selectedDay : ''} 
                  ${isHoveredRange && !isSelected ? styles.hoveredRangeDay : ''} 
                  ${(isSelectedStart || isSelectedEnd) ? styles.selectedEndpoint : ''}
                  ${isFocused ? styles.focusedDay : ''}
                  ${dropzoneActive ? styles.isDraggingOver : ''}
                `}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => setHoverDate(day)}
                
                // HTML5 Drag and Drop Target Logic
                onDragOver={(e) => {
                  e.preventDefault(); // Must prevent default to allow DND drop
                  if (dragOverDate !== dateKey) setDragOverDate(dateKey);
                }}
                onDragLeave={() => {
                  if (dragOverDate === dateKey) setDragOverDate(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDate(null);
                  const source = e.dataTransfer.getData('text/plain');
                  if (source && source !== dateKey) {
                    moveDailyNote(source, dateKey);
                  }
                }}
              >
                <div className={styles.dayNumberContainer}>
                  <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`} style={{ position: 'relative' }}>
                    {format(day, 'd')}
                    {isToday && renderWeatherIcon()}
                  </span>
                  
                  {/* Draggable Note Indicator */}
                  {hasNote && (
                    <span 
                      className={`${styles.noteIndicator} ${styles.draggableNote}`} 
                      title="Drag to move. Click to read."
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', dateKey);
                      }}
                    >
                      ✎
                    </span>
                  )}
                </div>
                
                <button 
                  className={styles.addNoteBtn}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    openNotesPanel(day);
                  }}
                >
                  {hasNote ? 'Read' : 'Note'}
                </button>
              </div>
            );
          })}
        </div>

        {/* NOTES SIDEBAR */}
        <AnimatePresence>
          {isNotesPanelOpen && activeNoteDate && (
            <motion.div 
              className={styles.notesPanelWrapper}
              // Adjust exit animation based on whether the user is deleting (peeling) or just closing
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1, rotateZ: 0, scale: 1 }}
              exit={isDeleting 
                ? { x: 50, y: 100, rotateZ: 15, rotateY: 45, scale: 0.5, borderRadius: '20px', opacity: 0 } 
                : { x: '100%', opacity: 0 }
              }
              transition={{ type: 'spring', bounce: 0, duration: isDeleting ? 0.4 : 0.4 }}
            >
              <div className={styles.notesPanel}>
                <div className={styles.notesHeader}>
                  <h3 className={styles.handwrittenTitle}>{format(activeNoteDate, 'MMMM d, yyyy')}</h3>
                  <button onClick={() => setIsNotesPanelOpen(false)} aria-label="Close notes"><X size={20}/></button>
                </div>
                <div className={styles.handwrittenNotesContainer}>
                  <textarea 
                    className={`${styles.dailyNoteInput} ${styles.handwrittenText}`}
                    autoFocus
                    placeholder="Jot down tasks, compile loops..."
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                  />
                </div>
                <div className={styles.notesActions} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button className={styles.deleteNoteBtn} onClick={handleDeleteNote} aria-label="Delete note">
                    <Trash2 size={16} /> Delete
                  </button>
                  <button className={styles.saveNoteBtn} onClick={handleSaveNote}>
                    <Check size={16} /> Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Real-time Clock Widget */}
      <LiveClock />
    </div>
  );
}
