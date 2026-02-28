/** @format */
import React, { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
import { toast } from "react-toastify";
import axiosInstance from "../../../components/auth/axiosInstance";
import { Bar, Line } from "react-chartjs-2";
import CensusModal from "./CensusModal.jsx";
import PopulationChart from "./PopulationChart.jsx"; // Add this import
import AgeGroupChart from "./AgeGroupChart.jsx"; // Add this import
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip, // ← ADD THIS
  Legend, // ← ADD THIS
} from "chart.js";
Chart.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip, // ← ADD THIS
  Legend // ← ADD THIS
);

const Dashboard = () => {
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

  // Sample data for graph (replace with API data as needed)
  const statsData = {
    labels: ["Senior Citizen", , "Male", "Female"],
    counts: [120, 45, 400, 380],
  };

  const barData = {
    labels: statsData.labels,
    datasets: [
      {
        label: "Population",
        data: statsData.counts,
        backgroundColor: [
          "#fbbf24",
          "#34d399",
          "#3b82f6",
          "#f472b6",
          "#a78bfa",
        ],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const Events = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showNoEventsModal, setShowNoEventsModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(true);
    const [showCensus, setShowCensus] = useState(true);

    // Add state for census stats
    const [censusStats, setCensusStats] = useState({
      ageGroups: [],
      loading: true,
    });

    // In your Dashboard.jsx, add this state and useEffect:
    const [populationData, setPopulationData] = useState({
      statistics: null,
      loading: true,
    });

    // Fetch real population data
    useEffect(() => {
      const fetchPopulationData = async () => {
        try {
          const response = await axiosInstance.get(
            "/resident-data/population/dashboard"
          );
          setPopulationData({
            statistics: response.data.data,
            loading: false,
          });
        } catch (err) {
          console.error("Error fetching population data:", err);
          setPopulationData((prev) => ({ ...prev, loading: false }));
        }
      };

      fetchPopulationData();
    }, []);

    // Then use this chart data:
    const populationChartData = populationData.statistics
      ? {
          labels: populationData.statistics.monthlyGrowth.map(
            (item) => item.month
          ),
          datasets: [
            {
              label: "Total Population",
              data: populationData.statistics.monthlyGrowth.map(
                (item) => item.cumulative
              ),
              borderColor: "#6366f1",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              tension: 0.4,
              fill: true,
            },
            {
              label: "New Registrations",
              data: populationData.statistics.monthlyGrowth.map(
                (item) => item.population
              ),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        }
      : null;

    useEffect(() => {
      setLoading(true);
      const fetchDashboardData = async () => {
        try {
          const [events, announcements] = await Promise.all([
            axiosInstance.get("/event/all"),
            axiosInstance.get("/announcement/all"),
          ]);
          setEvents(events.data.data);
          setAnnouncements(announcements.data.data);
        } catch (err) {
          toast.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, []);

    // Fetch user profile for census modal
    useEffect(() => {
      const fetchProfile = async () => {
        try {
          const response = await axiosInstance.get("/user/profile");
          setUser(response.data);
        } catch (err) {
          toast.error(err);
          localStorage.removeItem("userToken");
          console.error(err);
        }
      };

      fetchProfile();
    }, []);

    // Fetch census stats for user graphs
    useEffect(() => {
      const fetchCensusStats = async () => {
        try {
          const ageRes = await axiosInstance.get(
            "/resident-data/admin/age-groups"
          );
          setCensusStats({
            ageGroups: Object.entries(ageRes.data.statistics).map(
              ([name, val]) => ({
                name,
                count: val.count,
              })
            ),
            loading: false,
          });
        } catch (err) {
          setCensusStats((prev) => ({ ...prev, loading: false }));
        }
      };
      fetchCensusStats();
    }, []);

    useEffect(() => {
      if (user) {
        setShowCensus(user.alreadyAnswered === false);
      }
    }, [user]);

    const handleCensusComplete = () => {
      setShowCensus(false);
      // Optionally refetch user/profile data here
    };

    // Prevent background scrolling when modals are open
    useEffect(() => {
      if (showEventModal || showAnnouncementModal || showNoEventsModal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.body.style.overflow = "unset";
      };
    }, [showEventModal, showAnnouncementModal, showNoEventsModal]);

    // Calendar grid
    const monthDays = getMonthDays(currentYear, currentMonth);

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

    // Handle date click
    const handleDateClick = (day) => {
      if (!day) return;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      const dayEvents = getEventsForDate(dateStr);

      if (dayEvents.length > 0) {
        setSelectedEvent(dayEvents[0]); // Show first event if multiple exist
        setShowEventModal(true);
      } else {
        setSelectedDate(dateStr);
        setShowNoEventsModal(true);
      }
    };

    // Handle announcement click
    const handleAnnouncementClick = (announcement) => {
      setSelectedAnnouncement(announcement);
      setShowAnnouncementModal(true);
    };

    const formatDateTime = (isoDateStr) => {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };

      const date = new Date(isoDateStr);
      return date.toLocaleString("en-US", options);
    };
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

    const getEventsForDate = (dateStr) => {
      return events.filter((ev) => {
        const eventDate = new Date(ev.date);
        const formattedEventDate = eventDate.toISOString().split("T")[0];
        return formattedEventDate === dateStr;
      });
    };

    // Dynamic graph data for user dashboard (only Age Group)
    const ageGroupData = {
      labels: censusStats.ageGroups.map((g) => g.name),
      datasets: [
        {
          label: "Residents",
          data: censusStats.ageGroups.map((g) => g.count),
          backgroundColor: [
            "#6366f1",
            "#f59e0b",
            "#10b981",
            "#ec4899",
            "#8b5cf6",
            "#ef4444",
            "#3b82f6",
          ],
          borderRadius: 8,
        },
      ],
    };

    // // Modern Line Chart for Population Trend (simulate with age group data)
    // const lineData = {
    //   labels: censusStats.ageGroups.map((g) => g.name),
    //   datasets: [
    //     {
    //       label: "Population Trend",
    //       data: censusStats.ageGroups.map((g) => g.count),
    //       fill: true,
    //       borderColor: "#6366f1",
    //       backgroundColor: "rgba(99,102,241,0.15)",
    //       tension: 0.4,
    //       pointBackgroundColor: [
    //         "#6366f1",
    //         "#f59e0b",
    //         "#10b981",
    //         "#ec4899",
    //         "#8b5cf6",
    //         "#ef4444",
    //         "#3b82f6",
    //       ],
    //       pointBorderColor: [
    //         "#6366f1",
    //         "#f59e0b",
    //         "#10b981",
    //         "#ec4899",
    //         "#8b5cf6",
    //         "#ef4444",
    //         "#3b82f6",
    //       ],
    //       pointRadius: 7,
    //       pointHoverRadius: 10,
    //       borderWidth: 3,
    //     },
    //   ],
    // };

    // const lineOptions = {
    //   responsive: true,
    //   plugins: {
    //     legend: { display: true, position: "top" },
    //     title: { display: false },
    //     tooltip: {
    //       backgroundColor: "#fff",
    //       titleColor: "#6366f1",
    //       bodyColor: "#222",
    //       borderColor: "#6366f1",
    //       borderWidth: 2,
    //       padding: 12,
    //     },
    //   },
    //   scales: {
    //     x: {
    //       grid: { display: false },
    //       ticks: { color: "#6366f1", font: { size: 13, weight: "bold" } },
    //     },
    //     y: {
    //       beginAtZero: true,
    //       grid: { color: "#f3f4f6" },
    //       ticks: { color: "#6366f1", font: { size: 13, weight: "bold" } },
    //     },
    //   },
    // };

    return (
      <div className="min-h-screen flex flex-col p-8 max-w-7xl mx-auto gap-6">
        {/* Use the new chart components */}
        <PopulationChart
          populationData={populationData}
          loading={populationData.loading}
        />

       
          {/* <AgeGroupChart
            censusStats={censusStats}
            loading={censusStats.loading}
          /> */}

          {/* You can add more chart components here in the future */}
          {/* <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Additional Analytics
            </h3>
            <div className="h-80 flex items-center justify-center text-gray-500">
              More charts can be added here
            </div>
          </div> */}
    

        {loading && (
          <div className="absolute inset-0 h-full bg-white/60 bg-opacity-80 z-10 flex items-center justify-center rounded-lg">
            <Loader />
          </div>
        )}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ">
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
                            className="truncate px-2 py-0.5 rounded text-xs font-medium hover:shadow cursor-pointer"
                            style={{
                              background: ev.color,
                              color: "#222",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                              setShowEventModal(true);
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
          <div className="mt-2">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              This Month's Events
            </h2>
            <div className="flex flex-col gap-4">
              {events
                .filter(
                  (ev) =>
                    new Date(ev.date).getMonth() === currentMonth &&
                    new Date(ev.date).getFullYear() === currentYear
                )
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((ev) => (
                  <div
                    key={ev._id}
                    className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-black cursor-pointer"
                    onClick={() => {
                      setSelectedEvent(ev);
                      setShowEventModal(true);
                    }}
                  >
                    <div
                      className="w-2 h-10 rounded-full"
                      style={{ background: ev.color }}
                    ></div>
                    <img
                      src={ev.image.url}
                      alt={ev.title}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{ev.title}</div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(ev.createdAt)}
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

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-500 text-3xl hover:text-gray-700 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <img
                src={selectedEvent.image.url}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {formatDateTime(selectedEvent.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Time:</span>{" "}
                  {selectedEvent.time}
                </div>
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  {selectedEvent.description}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Details Modal */}
        {showAnnouncementModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedAnnouncement.title}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">
                    Posted on {formatDateTime(selectedAnnouncement.createdAt)}
                    {selectedAnnouncement.isUrgent && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="text-gray-500 text-3xl hover:text-gray-700 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div
                className={`p-4 rounded-lg mb-4 ${
                  selectedAnnouncement.urgent
                    ? "bg-red-50 border border-red-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedAnnouncement.description}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Events Modal */}
        {showNoEventsModal && (
          <div className="fixed inset-0 bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">No Events Scheduled</h3>
                <button
                  onClick={() => setShowNoEventsModal(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3">
                <p>There are no events scheduled for {selectedDate}.</p>
                <p>Please check back later for updates.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowNoEventsModal(false)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* {alreadyAnswered && (
          <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Cencus</h2>
            </div>
          </div>
        )} */}
        {showCensus && user && (
          <CensusModal user={user} onComplete={handleCensusComplete} />
        )}
      </div>
    );
  };

  return <Events />;
};

export default Dashboard;
