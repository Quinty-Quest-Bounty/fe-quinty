"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { subDays, subMonths, subYears, addDays, addMonths } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CalendarWithPresetsProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  className?: string;
  minDate?: Date;
}

export function CalendarWithPresets({
  date: initialDate,
  onDateChange,
  className,
  minDate,
}: CalendarWithPresetsProps) {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const lastWeek = subDays(today, 7);
  const lastMonth = subMonths(today, 1);
  const lastYear = subYears(today, 1);
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  const nextMonth = addMonths(today, 1);

  const [month, setMonth] = useState(initialDate || today);
  const [date, setDate] = useState<Date | undefined>(initialDate);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setMonth(newDate);
    }
    onDateChange?.(newDate);
  };

  const presets = [
    { label: "Today", date: today, show: !minDate || today >= minDate },
    { label: "Tomorrow", date: tomorrow, show: !minDate || tomorrow >= minDate },
    { label: "Next week", date: nextWeek, show: !minDate || nextWeek >= minDate },
    { label: "Next month", date: nextMonth, show: !minDate || nextMonth >= minDate },
    { label: "Yesterday", date: yesterday, show: !minDate || yesterday >= minDate },
    { label: "Last week", date: lastWeek, show: !minDate || lastWeek >= minDate },
    { label: "Last month", date: lastMonth, show: !minDate || lastMonth >= minDate },
    { label: "Last year", date: lastYear, show: !minDate || lastYear >= minDate },
  ];

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex max-sm:flex-col">
        <div className="relative border-border py-4 max-sm:order-1 max-sm:border-t sm:w-36">
          <div className="h-full border-border sm:border-e">
            <div className="flex flex-col space-y-1 px-3">
              {presets
                .filter((preset) => preset.show)
                .map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm font-normal"
                    onClick={() => {
                      handleDateChange(preset.date);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
            </div>
          </div>
        </div>
        <div className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            month={month}
            onMonthChange={setMonth}
            disabled={(date) => (minDate ? date < minDate : false)}
            initialFocus
          />
        </div>
      </div>
    </div>
  );
}
