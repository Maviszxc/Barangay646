import React from "react";
import { Calendar } from "lucide-react";

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let days = [];
  let week = [];
  let dayNum = 1 - firstDay;
  for (let i = 0; i < 6; i++) {
    week = [];
    for (let j = 0; j < 7; j++, dayNum++) {
      if (dayNum > 0 && dayNum <= daysInMonth) {
        week.push(dayNum);
      } else {
        week.push(null);
      }
    }
    days.push(week);
  }
  return days;
}

function formatDateTime(dateStr, timeStr) {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date(dateStr);
  date.setHours(hours, minutes);

  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}


const MiniCalendar = ({
  events,
  currentMonth,
  currentYear,
  getEventsForDate,
}) => {
  const todayDate = new Date();
  const monthDays = getMonthDays(currentYear, currentMonth);

  return (
    <div className="bg-white bg-opacity-70 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
      <h3 className="text-gray-500 text-sm mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Events (
        {new Date(currentYear, currentMonth).toLocaleString("default", {
          month: "long",
        })}
        )
      </h3>
      <div>
        {/* Mini Calendar */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.flat().map((day, idx) => {
              const dateStr = day
                ? `${currentYear}-${String(currentMonth + 1).padStart(
                    2,
                    "0"
                  )}-${String(day).padStart(2, "0")}`
                : null;
              const dayEvents = dateStr ? getEventsForDate(dateStr) : [];
              const isToday =
                day &&
                todayDate.getFullYear() === currentYear &&
                todayDate.getMonth() === currentMonth &&
                todayDate.getDate() === day;
              return (
                <div
                  key={idx}
                  className={`min-h-[50px] rounded-lg border ${
                    isToday ? "border-blue-500 border-2" : "border-gray-100"
                  } ${
                    isToday ? "bg-blue-50" : "bg-gray-50"
                  } relative transition text-xs ${
                    isToday ? "shadow-sm" : "shadow-none"
                  }
                    ${
                      day
                        ? "hover:border-black hover:bg-[#f1f5fd]"
                        : "opacity-0 pointer-events-none"
                    }
                  `}
                >
                  {day && (
                    <>
                      <div
                        className={`absolute top-1 left-2 text-xs font-semibold ${
                          isToday ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {day}
                        {isToday && (
                          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-4">
                        {dayEvents.slice(0, 1).map((ev) => (
                          <span
                            key={ev.title}
                            className="truncate px-1 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              background: ev.color,
                              color: "#222",
                            }}
                          >
                            {ev.title}
                          </span>
                        ))}
                        {dayEvents.length > 1 && (
                          <span className="text-[10px] text-gray-400">
                            +{dayEvents.length - 1} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* List of events for this month */}
        <div className="flex flex-col gap-2">
          {events
            .filter(
              (ev) =>
                new Date(ev.date).getMonth() === currentMonth &&
                new Date(ev.date).getFullYear() === currentYear
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((ev, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: ev.color }}
                ></span>
                <span className="text-xs font-medium text-gray-700">
                  {ev.title}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(ev.date, ev.time)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
