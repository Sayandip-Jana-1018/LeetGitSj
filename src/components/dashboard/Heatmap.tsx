"use client";

import { useMemo } from "react";
import { format, startOfWeek, subDays, addDays, isSameDay } from "date-fns";

interface HeatmapProps {
  data: Array<{ date: Date; count: number }>;
}

export function Heatmap({ data }: HeatmapProps) {
  // Generate the last 365 days of cells organized into 52 weeks
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // We want 52 weeks ending this week
    const startDate = subDays(today, 52 * 7 - 1);
    
    // Adjust startDate to be the Sunday of that week
    const firstSunday = startOfWeek(startDate, { weekStartsOn: 0 });
    
    const weeksList: Array<Array<{ date: Date; count: number; inFuture: boolean }>> = [];
    const months: Array<{ label: string; offset: number }> = [];
    
    let currentDate = firstSunday;
    let currentMonth = -1;
    
    // Create 52 columns (weeks)
    for (let w = 0; w < 52; w++) {
      const week: Array<{ date: Date; count: number; inFuture: boolean }> = [];
      
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(currentDate);
        
        // Month tracking for header
        if (dateObj.getDate() === 1 || (w === 0 && d === 0)) {
          if (currentMonth !== dateObj.getMonth()) {
            months.push({ label: format(dateObj, "MMM"), offset: w });
            currentMonth = dateObj.getMonth();
          }
        }
        
        // Find if we have data for this day
        const dayData = data.find(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return isSameDay(itemDate, dateObj);
        });
        
        week.push({
          date: dateObj,
          count: dayData ? dayData.count : 0,
          inFuture: dateObj > today
        });
        
        currentDate = addDays(currentDate, 1);
      }
      weeksList.push(week);
    }
    
    return { weeks: weeksList, monthLabels: months };
  }, [data]);

  // GitHub contribution color scale logic
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-[var(--color-surface-elevated)]";
    if (count <= 2) return "bg-[var(--color-accent)] opacity-40";
    if (count <= 4) return "bg-[var(--color-accent)] opacity-60";
    if (count <= 6) return "bg-[var(--color-accent)] opacity-80";
    return "bg-[var(--color-accent)]";
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-max flex flex-col">
        {/* Months header */}
        <div className="flex h-5 relative text-xs text-[var(--color-text-muted)] mb-1">
          {monthLabels.map((m, i) => (
            <div 
              key={i} 
              className="absolute" 
              style={{ left: `${m.offset * 14}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>
        
        <div className="flex gap-[4px]">
          {/* Days of week labels */}
          <div className="flex flex-col gap-[4px] text-[10px] text-[var(--color-text-muted)] pr-2 justify-between py-[4px]">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          
          {/* Grid */}
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-[4px]">
              {week.map((day, j) => (
                <div
                  key={j}
                  className={`w-2.5 h-2.5 rounded-sm ${day.inFuture ? 'opacity-0' : getColorClass(day.count)}`}
                  title={!day.inFuture ? `${day.count} submissions on ${format(day.date, 'MMM d, yyyy')}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
