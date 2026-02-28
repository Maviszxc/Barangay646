/** @format */

import React, { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Plus,
  UserPlus,
  CalendarPlus,
  ClipboardList,
  Star,
  Activity,
  Bell,
  Edit,
} from "lucide-react";
import StatCard from "../../../components/StatCard";
import QuickActionButton from "../../../components/QuickActionButton";
import MiniCalendar from "../../../components/MiniCalendar";
import AnnouncementList from "../../../components/AnnouncementList";
import RecentRequestList from "../../../components/RecentRequestList";
import axiosInstance from "../../../components/auth/axiosInstance";
import Loader from "../../../components/Loader";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import AddRequestModal from "../../../components/modals/AddRequestModal";
import AddResidentModal from "../../../components/modals/AddResidentModal";
import AddEventModal from "../../../components/modals/AddEventModal";
import AddAnnouncementModal from "../../../components/modals/AddAnnouncementModal";
import EditAboutPageModal from "../../../components/modals/EditAboutPageModal";

const Dashboard = () => {
  const [stat, setStat] = useState(null);
  const [event, setEvent] = useState([]);
  const [announcement, setAnnouncement] = useState([]);
  const [recentRequest, setRecentRequest] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [totalLoggedInUsers, setTotalLoggedInUsers] = useState(0);
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalRegisteredVoters, setTotalRegisteredVoters] = useState(0);

  // Modal visibility states
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [monthlyRequests, setMonthlyRequests] = useState([]);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] =
    useState(false);
  const [showEditAboutPageModal, setShowEditAboutPageModal] = useState(false);

  const getEventsForDate = (dateStr) =>
    (event ?? []).filter((ev) => ev.date?.slice(0, 10) === dateStr);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Quick action handlers
  const handleNewRequest = () => setShowAddRequestModal(true);
  const handleAddResident = () => setShowAddResidentModal(true);
  const handleAddEvent = () => setShowAddEventModal(true);
  const handleAddAnnouncement = () => setShowAddAnnouncementModal(true);
  const handleEditAboutPage = () => setShowEditAboutPageModal(true);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (
      showAddRequestModal ||
      showAddResidentModal ||
      showAddEventModal ||
      showAddAnnouncementModal ||
      showEditAboutPageModal
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    showAddRequestModal,
    showAddResidentModal,
    showAddEventModal,
    showAddAnnouncementModal,
    showEditAboutPageModal,
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          statsRes,
          eventsRes,
          announcementRes,
          recentRequestsRes,
          adminLogsRes,
          usersRes,
          householdRes,
          voterRes,
          monthlyRequestsRes, // Add this line
        ] = await Promise.all([
          axiosInstance.get("/barangay/stats"),
          axiosInstance.get("/event/all"),
          axiosInstance.get("/announcement/all"),
          axiosInstance.get("/admin/recent-request"),
          axiosInstance.get("/admin/admin-logs"),
          axiosInstance.get("/user/all-users"),
          axiosInstance.get("/resident-data/admin/total-households"),
          axiosInstance.get("/resident-data/admin/voter"),
          axiosInstance.get("/admin/monthly-requests"), // Add this line
        ]);

        setStat(statsRes.data);
        setEvent(eventsRes.data.data);
        setAnnouncement(announcementRes.data.data);
        setRecentRequest(recentRequestsRes.data.data);
        setAdminLogs(adminLogsRes.data.data);

        // Count only users who are approved/logged in
        const loggedInUsers = usersRes.data.users.filter(
          (u) => u.isLoginApproved
        );
        setTotalLoggedInUsers(loggedInUsers.length);

        // Total households from backend
        setTotalHouseholds(
          householdRes.data.data.totalHouseholds || loggedInUsers.length
        );

        // Registered voters from backend
        const registeredVoterStat = voterRes.data.statistics.find(
          (v) => v._id === "Registered"
        );
        setTotalRegisteredVoters(registeredVoterStat?.count || 0);

        // Set monthly requests data
        setMonthlyRequests(monthlyRequestsRes.data.data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen">
      {loading && (
        <div className="absolute inset-0 h-full bg-white/60 bg-opacity-80 z-10 flex items-center justify-center rounded-lg">
          <Loader />
        </div>
      )}
      <div className="max-w-7xl mx-auto mt-6">
        {/* Main Content */}
        <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-3xl p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-gray-500 text-sm mb-1">Barangay 646 Summary</h2>
            {/* Change to total logged in users */}
            <p className="text-4xl font-bold mb-4">
              {totalLoggedInUsers} Residents
            </p>
            <div className="flex space-x-4"></div>
            <div>
              <h3 className="text-gray-500 text-sm my-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Official Barangay ID
              </h3>
              <div className="bg-gradient-to-r from-black to-gray-700 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm opacity-80">BARANGAY ID</p>
                    <p className="text-xl mt-6">BRGY-646-0485</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Barangay Captain</p>
                    <p className="text-lg">Roel S. Floro</p>
                    <p className="text-xs opacity-80 mt-1">
                      123 Rizal St, Zone 67, San Miguel, Manila
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Make left column wider using grid-cols-3 and col-span-2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column (wider) */}
            <div className="space-y-8 md:col-span-2">
              <MiniCalendar
                events={event}
                currentMonth={currentMonth}
                currentYear={currentYear}
                getEventsForDate={getEventsForDate}
              />
              <div>
                <RecentRequestList requests={recentRequest.slice(0, 5)} />
              </div>
              {/* Additional Section: Admin Logs */}
              <div className="mt-10">
                <h3 className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Recent Activities
                </h3>
                <div className="bg-white bg-opacity-70 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                  {adminLogs && adminLogs.length > 0 ? (
                    <ul className="space-y-4">
                      {adminLogs.slice(0, 5).map((log, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">
                              {log.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(log.createdAt).toLocaleString([], {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activities found
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (narrower) */}
            <div className="space-y-8 md:col-span-1">
               <StatCard
                label="Latest PSA Demographics (Census 2015)"
                icon={<Users className="w-5 h-5" />}
                color="bg-white"
                extra={
                  <div>
                    {/* Age Distribution */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">
                        Age Groups
                      </h4>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>0-14</span>
                        <span>15-64</span>
                        <span>65+</span>
                      </div>
                      <div className="flex space-x-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400"
                          style={{ width: "28%" }}
                        ></div>
                        <div
                          className="h-full bg-green-400"
                          style={{ width: "35%" }}
                        ></div>
                        <div
                          className="h-full bg-orange-400"
                          style={{ width: "25%" }}
                        ></div>
                        <div
                          className="h-full bg-red-400"
                          style={{ width: "12%" }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {stat?.ageDistribution2015?.["0-14"]?.value}
                        </span>
                        <span>
                          {stat?.ageDistribution2015?.["15-64"]?.value}
                        </span>

                        <span>{stat?.ageDistribution2015?.["65+"]?.value}</span>
                      </div>
                    </div>
                    {/* Gender Distribution */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">
                        Age Dependency Ratio
                      </h4>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Working Age</span>
                        <span>Dependents</span>
                      </div>
                      <div className="flex space-x-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: "48%" }}
                        ></div>
                        <div
                          className="h-full bg-pink-500"
                          style={{ width: "52%" }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {" "}
                          {stat?.dependencyRatio
                            ? (
                                100 -
                                (stat.dependencyRatio.youth.value +
                                  stat.dependencyRatio.oldAge.value)
                              ).toFixed(2)
                            : "—"}
                          %
                        </span>
                        <span>
                          {" "}
                          {stat?.dependencyRatio
                            ? (
                                stat.dependencyRatio.youth.value +
                                stat.dependencyRatio.oldAge.value
                              ).toFixed(2)
                            : "—"}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                }
              />

              <div className="bg-white bg-opacity-70 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <QuickActionButton
                    onClick={handleNewRequest}
                    icon={<Plus className="w-6 h-6" />}
                    label="New Request"
                    color="bg-green-100 text-green-800 hover:bg-green-200"
                    className="h-24"
                  />
                  <QuickActionButton
                    onClick={handleAddResident}
                    icon={<UserPlus className="w-6 h-6" />}
                    label="Add Resident"
                    color="bg-purple-100 text-purple-800 hover:bg-purple-200"
                    className="h-24"
                  />
                  <QuickActionButton
                    onClick={handleAddAnnouncement}
                    icon={<Bell className="w-6 h-6" />}
                    label="Add Announcement"
                    color="bg-blue-100 text-blue-800 hover:bg-blue-200"
                    className="h-24"
                  />
                  <QuickActionButton
                    onClick={handleAddEvent}
                    icon={<CalendarPlus className="w-6 h-6" />}
                    label="Add Event"
                    color="bg-orange-100 text-orange-800 hover:bg-orange-200"
                    className="h-24"
                  />
                  <QuickActionButton
                    onClick={handleEditAboutPage}
                    icon={<Edit className="w-6 h-6" />}
                    label="Edit About Page"
                    color="bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                    className="h-24"
                  />
                </div>
              </div>
              <div className="bg-white bg-opacity-70 backdrop-blur-sm p-6 rounded-2xl shadow-sm">
                <h3 className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Monthly Requests
                </h3>
                <div className="flex items-end space-x-1 h-24 mb-2">
                  {monthlyRequests.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gray-900 rounded-t-sm transition-all duration-300 hover:bg-gray-700 cursor-pointer"
                      style={{ height: `${Math.max(item.count * 3, 5)}%` }} // Minimum 5% height for visibility
                      title={`${item.month}: ${item.count} requests`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  {monthlyRequests.slice(0, 10).map((item) => (
                    <span key={item.month}>{item.month}</span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {new Date().getFullYear()} • Total:{" "}
                  {monthlyRequests.reduce((sum, item) => sum + item.count, 0)}{" "}
                  requests
                </div>
              </div>
              <div>
                <AnnouncementList announcements={announcement} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      <AddRequestModal
        isOpen={showAddRequestModal}
        onClose={() => setShowAddRequestModal(false)}
        onRequestAdded={() => {
          // Refresh recent requests
          const fetchRecentRequests = async () => {
            try {
              const response = await axiosInstance.get("/admin/recent-request");
              setRecentRequest(response.data.data);
            } catch (error) {
              console.error("Error fetching recent requests:", error);
            }
          };
          fetchRecentRequests();
        }}
      />

      <AddResidentModal
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
        onResidentAdded={() => {
          // Refresh stats
          const fetchStats = async () => {
            try {
              const response = await axiosInstance.get("/barangay/stats");
              setStat(response.data);
            } catch (error) {
              console.error("Error fetching stats:", error);
            }
          };
          fetchStats();
        }}
      />

      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onEventAdded={() => {
          // Refresh events
          const fetchEvents = async () => {
            try {
              const response = await axiosInstance.get("/event/all");
              setEvent(response.data.data);
            } catch (error) {
              console.error("Error fetching events:", error);
            }
          };
          fetchEvents();
        }}
      />

      <AddAnnouncementModal
        isOpen={showAddAnnouncementModal}
        onClose={() => setShowAddAnnouncementModal(false)}
        onAnnouncementAdded={() => {
          // Refresh announcements
          const fetchAnnouncements = async () => {
            try {
              const response = await axiosInstance.get("/announcement/all");
              setAnnouncement(response.data.data);
            } catch (error) {
              console.error("Error fetching announcements:", error);
            }
          };
          fetchAnnouncements();
        }}
      />

      <EditAboutPageModal
        isOpen={showEditAboutPageModal}
        onClose={() => setShowEditAboutPageModal(false)}
        onAboutUpdated={() => {
          // About page updated successfully
          toast.success("About page updated successfully!");
        }}
      />
    </div>
  );
};

export default Dashboard;
