import React, { useState, useEffect } from 'react';
import styles from './CommandPalette.module.css';
import { Search, Moon, Sun, Volume2, VolumeX, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Command = {
  id: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
};

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isNightMode: boolean;
  setIsNightMode: (v: boolean) => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  jumpToMonth: (monthIndex: number) => void;
}

export default function CommandPalette({
  isOpen, setIsOpen, isNightMode, setIsNightMode, isMuted, setIsMuted, jumpToMonth
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Reset search on close
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const commands: Command[] = [
    {
      id: 'toggle-theme',
      title: isNightMode ? 'Switch to Day Mode' : 'Switch to Night Mode',
      icon: isNightMode ? <Sun size={18} /> : <Moon size={18} />,
      action: () => {
        setIsNightMode(!isNightMode);
        setIsOpen(false);
      }
    },
    {
      id: 'toggle-audio',
      title: isMuted ? 'Unmute Audio' : 'Mute Audio',
      icon: isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />,
      action: () => {
        setIsMuted(!isMuted);
        setIsOpen(false);
      }
    },
    // Generate commands to jump to specific months
    ...Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(2026, i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      return {
        id: `jump-${i}`,
        title: `Jump to ${monthName}`,
        icon: <CalendarIcon size={18} />,
        action: () => {
          jumpToMonth(i);
          setIsOpen(false);
        }
      };
    })
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <motion.div 
            className={styles.palette}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.inputWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input 
                autoFocus
                className={styles.input} 
                placeholder="Type a command or search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.list}>
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => (
                  <div 
                    key={cmd.id} 
                    className={styles.item}
                    onClick={cmd.action}
                  >
                    <span className={styles.icon}>{cmd.icon}</span>
                    <span>{cmd.title}</span>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>No commands found.</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
