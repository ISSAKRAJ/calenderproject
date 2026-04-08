import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import styles from './LiveClock.module.css';

export default function LiveClock() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.clockContainer}>
      <Clock size={12} className={styles.icon} />
      <span className={styles.timeText}>{format(time, 'hh:mm:ss a')}</span>
    </div>
  );
}
