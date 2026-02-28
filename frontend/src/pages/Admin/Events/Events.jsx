import React, { useState, useEffect } from "react";
import { Calendar, Plus, X, Megaphone } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../components/auth/axiosInstance";
import Loader from "../../../components/Loader";
import AddEventModal from "../../../components/modals/AddEventModal";
import AddAnnouncementModal from "../../../components/modals/AddAnnouncementModal";

// Simple calendar grid helper
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

const Events = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] =
    useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    description: "",
    urgent: false,
  });

  // Add Event Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    image: null,
    previewImage: null,
    color: "#a5d8ff",
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsRes, announcementsRes] = await Promise.all([
          axiosInstance.get("/event/all"),
          axiosInstance.get("/announcement/all"),
        ]);

        setEvents(eventsRes.data.data || []);
        setAnnouncements(announcementsRes.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calendar grid
  const monthDays = getMonthDays(currentYear, currentMonth);

  // Get events for a specific date
  const getEventsForDate = (dateStr) => {
    const date = new Date(dateStr);
    return events.filter((ev) => {
      const eventDate = new Date(ev.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Handle calendar navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Handle date click: open add event modal with date prefilled
  const handleDateClick = (day) => {
    if (!day) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setNewEvent({
      title: "",
      date: dateStr,
      time: "",
      description: "",
      image: null,
      previewImage: null,
      color: "#a5d8ff",
    });
    setShowAddModal(true);
  };

  // Handle event click: show event details modal
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle announcement click
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvent({
          ...newEvent,
          image: file,
          previewImage: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Update the handleAddEvent function in Events.jsx
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", newEvent.title);
      formData.append("description", newEvent.description);
      formData.append("date", newEvent.date);
      formData.append("time", newEvent.time);
      formData.append("color", newEvent.color);
      if (newEvent.image) {
        formData.append("event-image", newEvent.image);
      }

      const response = await axiosInstance.post("/event/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setEvents([...events, response.data.event]);
      toast.success("Event added successfully!");
      setShowAddModal(false);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        description: "",
        image: null,
        previewImage: null,
        color: "#a5d8ff",
      });
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    } finally {
      setLoading(false);
    }
  };
  // Handle add announcement submit
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.post("/announcement/create", {
        title: newAnnouncement.title,
        description: newAnnouncement.description,
        isUrgent: newAnnouncement.urgent,
      });

      setAnnouncements([response.data.announcement, ...announcements]);
      toast.success("Announcement added successfully!");
      setShowAddAnnouncementModal(false);
      setNewAnnouncement({
        title: "",
        description: "",
        urgent: false,
      });
    } catch (error) {
      console.error("Error adding announcement:", error);
      toast.error("Failed to add announcement");
    } finally {
      setLoading(false);
    }
  };

  // Color palette for events
  const colorOptions = [
    "#a5d8ff",
    "#c3f584",
    "#ffd6e0",
    "#fff3bf",
    "#f1c0e8",
    "#b197fc",
  ];

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Add this new function
  const formatDateTime = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Events & Announcements
          </h1>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer"
              onClick={() => setShowAddAnnouncementModal(true)}
            >
              <Megaphone size={18} /> Add Announcement
            </button>
            <button
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer"
              onClick={() => {
                setSelectedDate(null);
                setShowAddModal(true);
                setNewEvent({
                  title: "",
                  date: "",
                  time: "",
                  description: "",
                  image: null,
                  previewImage: null,
                  color: "#a5d8ff",
                });
              }}
            >
              <Plus size={18} /> Add Event
            </button>
          </div>
        </div>

        {/* Announcements Section */}
        {announcements.filter((announcement) => !announcement.isOld).length >
          0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                Latest Announcements
              </h2>
              {/* <button className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                View All
              </button> */}
            </div>

            <div className="space-y-4">
              {announcements
                .filter((announcement) => !announcement.isOld) // ✅ Filter out old announcements
                .map((announcement) => (
                  <div
                    key={announcement._id} // Use _id instead of id if that's from MongoDB
                    className={`p-4 rounded-lg border cursor-pointer transition hover:border-black ${
                      announcement.isUrgent
                        ? "border-red-200 bg-red-50"
                        : "border-gray-100 bg-gray-50"
                    }`}
                    onClick={() => handleAnnouncementClick(announcement)}
                  >
                    <div className="flex justify-between items-start">
                      <h3
                        className={`font-medium ${
                          announcement.isUrgent
                            ? "text-red-700"
                            : "text-gray-800"
                        }`}
                      >
                        {announcement.title}
                        {announcement.isUrgent && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            Urgent
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(announcement.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {announcement.description}
                    </p>
                    <div className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                      Read more...
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4">
            <button
              className="text-gray-500 hover:text-black px-2 py-1 rounded cursor-pointer"
              onClick={handlePrevMonth}
            >
              &lt;
            </button>
            <div className="font-semibold text-lg">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              className="text-gray-500 hover:text-black px-2 py-1 rounded cursor-pointer"
              onClick={handleNextMonth}
            >
              &gt;
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDays.flat().map((day, idx) => {
              const dateStr = day
                ? `${currentYear}-${String(currentMonth + 1).padStart(
                    2,
                    "0"
                  )}-${String(day).padStart(2, "0")}`
                : null;
              const dayEvents = dateStr ? getEventsForDate(dateStr) : [];

              // Check if this day is today's date
              const todayDate = new Date();
              const isToday =
                day &&
                todayDate.getFullYear() === currentYear &&
                todayDate.getMonth() === currentMonth &&
                todayDate.getDate() === day;

              return (
                <div
                  key={idx}
                  className={`min-h-[60px] rounded-lg border relative group cursor-pointer transition
                    ${
                      isToday
                        ? "border-2 border-blue-500 bg-[#e3fafc] shadow-sm"
                        : "border border-gray-100 bg-gray-50"
                    }
                    ${
                      day
                        ? "hover:border-black hover:bg-[#f1f5fd]"
                        : "opacity-0 pointer-events-none"
                    }
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  {day && (
                    <>
                      <div className="absolute top-1 left-2 text-xs font-semibold text-gray-700 flex items-center">
                        {day}
                        {isToday && (
                          <div className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev._id}
                            className="truncate px-2 py-0.5 rounded hover:shadow text-xs font-medium"
                            style={{
                              background: ev.color,
                              color: "#222",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(ev);
                            }}
                          >
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{dayEvents.length - 2} more...
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

        {/* List of events for the month */}
        {events.filter(
          (ev) =>
            new Date(ev.date).getMonth() === currentMonth &&
            new Date(ev.date).getFullYear() === currentYear
        ).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              This Month's Events
            </h2>
            <div className="flex flex-col gap-4">
              {events
                .filter((ev) => {
                  const eventDate = new Date(ev.date);
                  return (
                    eventDate.getMonth() === currentMonth &&
                    eventDate.getFullYear() === currentYear
                  );
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((ev) => (
                  <div
                    key={ev._id}
                    className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-black cursor-pointer"
                    onClick={() => handleEventClick(ev)}
                  >
                    <div
                      className="w-2 h-10 rounded-full"
                      style={{ background: ev.color }}
                    ></div>
                    {ev.image?.url ? (
                      <img
                        src={ev.image.url}
                        alt={ev.title}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <Calendar className="text-gray-400" size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{ev.title}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(ev.date)} • {ev.time}
                      </div>
                      <div className="text-sm text-gray-700 truncate">
                        {ev.description}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onEventAdded={() => {
          // Refresh events after adding
          axiosInstance
            .get("/event/all")
            .then((res) => setEvents(res.data.data))
            .catch((err) => console.error("Error fetching events:", err));
        }}
      />

      <AddAnnouncementModal
        isOpen={showAddAnnouncementModal}
        onClose={() => setShowAddAnnouncementModal(false)}
        onAnnouncementAdded={() => {
          // Refresh announcements after adding
          axiosInstance
            .get("/announcement/all")
            .then((res) => setAnnouncements(res.data.data))
            .catch((err) =>
              console.error("Error fetching announcements:", err)
            );
        }}
      />
      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer"
              onClick={() => setShowEventModal(false)}
            >
              <X size={20} />
            </button>
            {selectedEvent.image?.url ? (
              <img
                src={selectedEvent.image.url}
                alt={selectedEvent.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <Calendar className="text-gray-400" size={40} />
              </div>
            )}
            <h2 className="text-xl font-bold mb-2">{selectedEvent.title}</h2>
            <div className="text-gray-500 text-sm mb-2">
              {formatDate(selectedEvent.date)} • {selectedEvent.time}
            </div>
            <div className="mb-2 text-gray-700">
              {selectedEvent.description}
            </div>
            <div className="flex gap-2 mt-2">
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{ background: selectedEvent.color }}
              ></span>
              <span className="text-xs text-gray-500">Event color</span>
            </div>
          </div>
        </div>
      )}
      {/* Announcement Details Modal */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer"
              onClick={() => setShowAnnouncementModal(false)}
            >
              <X size={20} />
            </button>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">
                {selectedAnnouncement.title}
              </h2>
              <div className="text-sm text-gray-500">
                Posted on {formatDate(selectedAnnouncement.createdAt)}
                {selectedAnnouncement.isUrgent && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    Urgent
                  </span>
                )}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg mb-4 ${
                selectedAnnouncement.isUrgent
                  ? "bg-red-50 border border-red-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <p className="text-gray-700 whitespace-pre-line">
                {selectedAnnouncement.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
