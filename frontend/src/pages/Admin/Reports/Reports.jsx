// [file name]: Reports.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import templatePdf from "./template.pdf"; // Import the template

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from "chart.js";
import Loader from "../../../components/Loader";
import { Bar, Line, Pie, Doughnut, Radar } from "react-chartjs-2";
import {
  Download,
  Users,
  Briefcase,
  Vote,
  Home,
  Filter,
  X,
  Search,
  ChevronDown,
  TrendingUp,
  ClipboardList,
  TrendingDown,
  Crown,
  User,
  Phone,
  Calendar,
  MapPin,
  Mail,
  Heart,
  BriefcaseIcon,
  School,
  Users2,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
} from "lucide-react";
import axiosInstance from "../../../components/auth/axiosInstance";
import IDImageViewer from "../../../components/IDImageViewer";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

// Modern color palettes
const MODERN_COLORS = {
  primary: "#6366f1",
  secondary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  dark: "#1f2937",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#4f46e5",
};

const GENDER_COLORS = {
  Male: "#6366f1",
  Female: "#ec4899",
  "LGBTQ+": "#8b5cf6",
};

const EMPLOYMENT_COLORS = {
  Employed: "#10b981",
  Unemployed: "#ef4444",
  PWD: "#8b5cf6",
  OFW: "#f59e0b",
  "Solo Parent": "#ec4899",
  "Out-of-School Youth": "#3b82f6",
  "Out-of-School Children": "#6366f1",
  Kasambahay: "#06b6d4",
};

const VOTER_COLORS = {
  Registered: "#10b981",
  "Not Registered": "#ef4444",
  "Pre-Registered": "#f59e0b",
};

// Date Filter Component
const DateFilter = ({ 
  dateRange, 
  setDateRange, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  showCustomDateRange, 
  setShowCustomDateRange 
}) => {
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setShowCustomDateRange(range === "custom");
    
    if (range === "all") {
      setStartDate("");
      setEndDate("");
    } else if (range === "30days") {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (range === "3months") {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (range === "6months") {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (range === "1year") {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Date Range:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDateRangeChange("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              dateRange === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => handleDateRangeChange("30days")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              dateRange === "30days"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleDateRangeChange("3months")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              dateRange === "3months"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Last 3 Months
          </button>
          <button
            onClick={() => handleDateRangeChange("6months")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              dateRange === "6months"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => handleDateRangeChange("1year")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              dateRange === "1year"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Last Year
          </button>
          <button
            onClick={() => handleDateRangeChange("custom")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              dateRange === "custom"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Custom Range
          </button>
        </div>

        {showCustomDateRange && (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {(dateRange !== "all" || (startDate && endDate)) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {dateRange === "all" 
                ? "Showing all data" 
                : startDate && endDate
                ? `Filtering from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                : "Select date range to filter data"
              }
            </span>
            <button
              onClick={() => handleDateRangeChange("all")}
              className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const [dashboardData, setDashboardData] = useState({
    households: {},
    ageDistribution: { chartData: [], summary: {} },
    householdGraph: [],
    statistics: {},
    employmentStats: [],
    voterStats: [],
    genderStats: [],
    allResidents: [],
    // Add these for admin totals
    adminTotals: {
      totalUsers: 0,
      totalLoggedInUsers: 0,
      totalHouseholds: 0,
      totalRegisteredVoters: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [selectedResidents, setSelectedResidents] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filters, setFilters] = useState({
    street: "",
    minSize: "",
    maxSize: "",
    ageGroup: "",
    gender: "",
  });
  const [householdSearch, setHouseholdSearch] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [showIDViewer, setShowIDViewer] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState("");
  const [exporting, setExporting] = useState(false);

  // Date filter states
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // Chart refs for interactivity
  const ageChartRef = useRef();
  const genderChartRef = useRef();
  const employmentChartRef = useRef();
  const voterChartRef = useRef();

  // Fetch backend data for all graphs and stats
  useEffect(() => {
    fetchDashboardData();
    fetchAdminTotals();
  }, []);

  // Refetch data when date filters change
  useEffect(() => {
    if (dateRange !== "all" || (startDate && endDate)) {
      fetchDashboardData({ startDate, endDate });
    } else if (dateRange === "all") {
      fetchDashboardData();
    }
  }, [dateRange, startDate, endDate]);

  const fetchDashboardData = async (dateParams = {}) => {
    setLoading(true);
    setError(null);
    
    // Build query string for date parameters
    const { startDate, endDate } = dateParams;
    let dateQuery = "";
    if (startDate && endDate) {
      dateQuery = `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    try {
      const [
        householdsRes,
        ageRes,
        graphRes,
        employmentRes,
        voterRes,
        genderRes,
        allResidentsRes,
      ] = await Promise.all([
        axiosInstance.get(`/resident-data/admin/enhanced-households${dateQuery}`),
        axiosInstance.get(`/resident-data/admin/enhanced-age-distribution${dateQuery}`),
        axiosInstance.get(`/resident-data/admin/household-graph${dateQuery}`),
        axiosInstance.get(`/resident-data/admin/employment${dateQuery}`),
        axiosInstance.get(`/resident-data/admin/voter${dateQuery}`),
        axiosInstance.get(`/resident-data/admin/gender${dateQuery}`),
        axiosInstance.get(`/resident-data/admin/all${dateQuery}`),
      ]);

      console.log("Age Distribution Data:", ageRes.data);
      console.log("Household Data:", householdsRes.data);
      console.log("Graph Data:", graphRes.data);
      console.log("Employment Data:", employmentRes.data);
      console.log("Voter Data:", voterRes.data);
      console.log("Gender Data:", genderRes.data);
      console.log("All Residents Data:", allResidentsRes.data);

      // Transform data for better visualization
      const transformedData = {
        households: householdsRes.data.data || {},
        ageDistribution: transformAgeData(ageRes.data.data) || {
          chartData: [],
          summary: {},
        },
        householdGraph: transformHouseholdGraphData(graphRes.data.data) || [],
        employmentStats: employmentRes.data.statistics || [],
        voterStats: voterRes.data.statistics || [],
        genderStats: genderRes.data.statistics || [],
        allResidents: allResidentsRes.data.data || [],
        statistics: {
          totalResidents: ageRes.data.data?.totalResidents || 0,
          totalHouseholds:
            householdsRes.data.data?.summary?.totalHouseholds || 0,
          averageHouseholdSize:
            householdsRes.data.data?.summary?.averageHouseholdSize || 0,
          growthTrend: householdsRes.data.data?.growthTrend || {
            growth: 0,
            growthPercentage: 0,
            trend: "stable",
          },
        },
      };

      setDashboardData(transformedData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      setDashboardData({
        households: {},
        ageDistribution: { chartData: [], summary: {} },
        householdGraph: [],
        employmentStats: [],
        voterStats: [],
        genderStats: [],
        allResidents: [],
        statistics: {},
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin totals for summary cards
  const fetchAdminTotals = async () => {
    try {
      // Get all users
      const usersRes = await axiosInstance.get("/user/all-users");
      const loggedInUsers = usersRes.data.users.filter(
        (u) => u.isLoginApproved
      );
      // Get total households
      const householdsRes = await axiosInstance.get(
        "/resident-data/admin/total-households"
      );
      // Get registered voters
      const voterRes = await axiosInstance.get("/resident-data/admin/voter");
      const registeredVoterStat = voterRes.data.statistics.find(
        (v) => v._id === "Registered"
      );

      setDashboardData((prev) => ({
        ...prev,
        adminTotals: {
          totalUsers: usersRes.data.totalCensusCount || 0,
          totalLoggedInUsers: loggedInUsers.totalCensusCount || 0,
          totalHouseholds: householdsRes.data.data.totalHouseholds || 0,
          totalRegisteredVoters: registeredVoterStat?.count || 0,
        },
      }));
    } catch (error) {
      setDashboardData((prev) => ({
        ...prev,
        adminTotals: {
          totalLoggedInUsers: 0,
          totalHouseholds: 0,
          totalRegisteredVoters: 0,
        },
      }));
    }
  };

  const groupMembersByFamily = (members) => {
    if (!members || !Array.isArray(members)) return [];

    // Extract last names and group members
    const familyGroups = members.reduce((groups, member) => {
      const fullName = member.fullName || member.name || "Unknown";
      const lastName = fullName.split(" ").pop() || "Unknown";

      if (!groups[lastName]) {
        groups[lastName] = {
          familyName: lastName,
          members: [],
          headOfFamily: null,
        };
      }

      groups[lastName].members.push(member);

      // Identify head of family for this family group
      if (member.isHeadOfFamily) {
        groups[lastName].headOfFamily = member;
      }

      return groups;
    }, {});

    return Object.values(familyGroups);
  };

  // Data transformation functions
  const transformAgeData = (ageData) => {
    if (!ageData || !ageData.chartData) {
      console.log("No age data available");
      return { chartData: [], summary: {} };
    }

    const transformed = {
      ...ageData,
      chartData: ageData.chartData.map((item) => ({
        ...item,
        male: Math.abs(item.male || 0),
        female: Math.abs(item.female || 0),
        lgbtq: item.lgbtq || 0,
      })),
    };

    console.log("Transformed Age Data:", transformed);
    return transformed;
  };

  const transformHouseholdGraphData = (graphData) => {
    if (!graphData || !Array.isArray(graphData)) {
      console.log("No household graph data available");
      return [];
    }

    const transformed = graphData.map((household, index) => ({
      ...household,
      id:
        household.id ||
        `${household.address}-${household.houseNumber}-${index}`,
      name: household.name || `${household.address} ${household.houseNumber}`,
      // Fix: Use actual member count from members array or totalMembers
      value: household.members?.length || household.totalMembers || 1,
      totalMembers: household.members?.length || household.totalMembers || 1,
      color: household.color || MODERN_COLORS.primary,
    }));

    console.log("Transformed Household Data:", transformed);
    return transformed;
  };

  // Transform employment data from backend
  const transformEmploymentData = (employmentStats) => {
    if (!employmentStats || !Array.isArray(employmentStats)) {
      return { labels: [], datasets: [] };
    }

    const labels = employmentStats.map((item) => item._id || "Unknown");
    const data = employmentStats.map((item) => item.count || 0);
    const backgroundColors = employmentStats.map(
      (item) => EMPLOYMENT_COLORS[item._id] || MODERN_COLORS.primary
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    };
  };

  // Transform voter data from backend
  const transformVoterData = (voterStats) => {
    if (!voterStats || !Array.isArray(voterStats)) {
      return { labels: [], datasets: [] };
    }

    const labels = voterStats.map((item) => item._id || "Unknown");
    const data = voterStats.map((item) => item.count || 0);
    const backgroundColors = voterStats.map(
      (item) => VOTER_COLORS[item._id] || MODERN_COLORS.primary
    );

    return {
      labels,
      datasets: [
        {
          label: "Voter Registration",
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  };

  // Transform gender data from backend
  const transformGenderData = (genderStats) => {
    if (!genderStats || !Array.isArray(genderStats)) {
      return { labels: [], datasets: [] };
    }

    const labels = genderStats.map((item) => item._id || "Unknown");
    const data = genderStats.map((item) => item.count || 0);
    const backgroundColors = genderStats.map(
      (item) => GENDER_COLORS[item._id] || MODERN_COLORS.primary
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    };
  };

  // Get image URL from resident data - ENHANCED VERSION
  const getResidentImage = (resident) => {
    if (!resident) return null;

    // Try different possible image paths in order of preference
    // For direct resident object (from allResidents)
    if (resident?.image && resident.image !== "https://via.placeholder.com/150")
      return resident.image;
    if (
      resident?.idImage &&
      resident.idImage !== "https://via.placeholder.com/150"
    )
      return resident.idImage;

    // For nested user structure (from census data)
    if (resident?.userId?.idImage) return resident.userId.idImage;
    if (resident?.user?.idImage) return resident.user.idImage;

    // Check for nested userData structure (from aggregations)
    if (resident?.userData?.idImage) return resident.userData.idImage;
    if (resident?.censusData?.userId?.idImage)
      return resident.censusData.userId.idImage;

    // For household members structure
    if (resident?.image) return resident.image;

    // Return null for no image instead of external URL
    return null;
  };

  // Filter residents by criteria
  const filterResidentsByCriteria = (criteria) => {
    const { type, value } = criteria;

    let filteredResidents = [];

    switch (type) {
      case "age-group":
        const [minAge, maxAge] = value.split("-").map(Number);
        filteredResidents = dashboardData.allResidents.filter((resident) => {
          const age = resident.age;
          if (maxAge) {
            return age >= minAge && age <= maxAge;
          } else {
            return age >= minAge;
          }
        });
        break;

      case "gender":
        filteredResidents = dashboardData.allResidents.filter(
          (resident) => resident.sex === value
        );
        break;

      case "employment":
        filteredResidents = dashboardData.allResidents.filter(
          (resident) => resident.employmentStatus === value
        );
        break;

      case "voter":
        filteredResidents = dashboardData.allResidents.filter(
          (resident) => resident.voterStatus === value
        );
        break;

      default:
        filteredResidents = [];
    }

    return filteredResidents;
  };

  // PDF Export Function - ENHANCED VERSION
  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Fetch complete household details with families
      const householdsWithFullDetails = await Promise.all(
        dashboardData.householdGraph.map(async (household) => {
          try {
            const response = await axiosInstance.get(
              `/resident-data/admin/complete-household/${encodeURIComponent(
                household.address
              )}/${household.houseNumber}`
            );

            const householdData = response.data.data;
            let members = [];
            let families = [];

            // Process members
            if (householdData.members && Array.isArray(householdData.members)) {
              members = householdData.members.map((member) => ({
                name: member.fullName || "Unknown",
                age:
                  member.age ||
                  calculateAgeFromBirthdate(member.birthdate) ||
                  "N/A",
                gender: member.gender || member.sex || "N/A",
                civilStatus: member.civilStatus || "N/A",
                occupation: member.occupation || "N/A",
                employmentStatus: member.employmentStatus || "N/A",
                voterStatus: member.voterStatus || "N/A",
                isHeadOfFamily: member.isHeadOfFamily || false,
                birthdate: member.birthdate || null,
                hasCensusData: member.hasCensusData || false,
              }));
            } else if (household.members && Array.isArray(household.members)) {
              members = household.members.map((member) => ({
                name: member.name || member.fullName || "Unknown",
                age:
                  member.age ||
                  calculateAgeFromBirthdate(member.birthdate) ||
                  "N/A",
                gender: member.gender || member.sex || "N/A",
                civilStatus: member.civilStatus || "N/A",
                occupation: member.occupation || "N/A",
                employmentStatus: member.employmentStatus || "N/A",
                voterStatus: member.voterStatus || "N/A",
                isHeadOfFamily: member.isHeadOfFamily || false,
                birthdate: member.birthdate || null,
                hasCensusData: member.hasCensusData || false,
              }));
            }

            // Process families using the groupMembersByFamily function
            if (
              householdData.families &&
              Array.isArray(householdData.families)
            ) {
              families = householdData.families;
            } else if (
              householdData.members &&
              Array.isArray(householdData.members)
            ) {
              families = groupMembersByFamily(householdData.members);
            } else if (household.members && Array.isArray(household.members)) {
              families = groupMembersByFamily(household.members);
            }

            // Count total heads in the household
            const totalHeads = members.filter(
              (member) => member.isHeadOfFamily
            ).length;

            return {
              ...household,
              members: members,
              families: families,
              headOfFamily:
                householdData.headOfFamily || household.headOfFamily,
              membersWithCensus:
                householdData.membersWithCensus ||
                household.membersWithCensus ||
                members.filter((m) => m.hasCensusData).length ||
                0,
              totalMembers: members.length,
              totalHeads: totalHeads,
              familyCount: families.length,
            };
          } catch (error) {
            console.error(
              `Failed to fetch details for ${household.address}:`,
              error
            );

            let fallbackMembers = [];
            let fallbackFamilies = [];
            if (household.members && Array.isArray(household.members)) {
              fallbackMembers = household.members.map((member) => ({
                name: member.name || member.fullName || "Unknown",
                age:
                  member.age ||
                  calculateAgeFromBirthdate(member.birthdate) ||
                  "N/A",
                gender: member.gender || member.sex || "N/A",
                civilStatus: member.civilStatus || "N/A",
                occupation: member.occupation || "N/A",
                employmentStatus: member.employmentStatus || "N/A",
                voterStatus: member.voterStatus || "N/A",
                isHeadOfFamily: member.isHeadOfFamily || false,
                birthdate: member.birthdate || null,
                hasCensusData: member.hasCensusData || false,
              }));

              fallbackFamilies = groupMembersByFamily(household.members);
            }

            const totalHeads = fallbackMembers.filter(
              (member) => member.isHeadOfFamily
            ).length;

            return {
              ...household,
              members: fallbackMembers,
              families: fallbackFamilies,
              totalMembers: fallbackMembers.length,
              membersWithCensus: fallbackMembers.filter((m) => m.hasCensusData)
                .length,
              totalHeads: totalHeads,
              familyCount: fallbackFamilies.length,
            };
          }
        })
      );

      // ===== LOAD TEMPLATE PDF =====
      console.log("Loading template PDF...");

      // Fetch the template
      const templateResponse = await fetch(templatePdf);

      if (!templateResponse.ok) {
        throw new Error(
          `Failed to load template: HTTP ${templateResponse.status}`
        );
      }

      const templateBytes = await templateResponse.arrayBuffer();
      console.log("Template loaded, size:", templateBytes.byteLength, "bytes");

      // Create PDF from template
      const pdfDoc = await PDFDocument.load(templateBytes);
      console.log("Template PDF parsed successfully");

      // Get fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );

      // Get the first page of the template
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Helper function to add text
      const addText = (
        page,
        text,
        x,
        y,
        size = 12,
        isBold = false,
        align = "left"
      ) => {
        const font = isBold ? helveticaBoldFont : helveticaFont;
        const textWidth = font.widthOfTextAtSize(text, size);

        let adjustedX = x;
        if (align === "center") {
          adjustedX = width / 2 - textWidth / 2;
        } else if (align === "right") {
          adjustedX = width - x - textWidth;
        }

        page.drawText(text, {
          x: adjustedX,
          y: height - y,
          size,
          font,
          color: rgb(0, 0, 0),
        });

        return textWidth;
      };

      // Helper function to draw a table with borders
      const drawTable = (
        page,
        data,
        headers,
        columnWidths,
        startX,
        startY,
        rowHeight = 20,
        fontSize = 10
      ) => {
        const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        let currentY = startY;

        // Draw headers
        let currentX = startX;
        for (let i = 0; i < headers.length; i++) {
          // Draw cell border
          page.drawRectangle({
            x: currentX,
            y: height - currentY,
            width: columnWidths[i],
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          // Draw header text (centered)
          const text = headers[i];
          const textWidth = helveticaBoldFont.widthOfTextAtSize(text, fontSize);
          const textX = currentX + (columnWidths[i] - textWidth) / 2;

          page.drawText(text, {
            x: textX,
            y: height - currentY + (rowHeight - fontSize) / 2,
            size: fontSize,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          });

          currentX += columnWidths[i];
        }

        currentY += rowHeight;

        // Draw data rows
        for (let row of data) {
          currentX = startX;
          for (let i = 0; i < row.length; i++) {
            // Draw cell border
            page.drawRectangle({
              x: currentX,
              y: height - currentY,
              width: columnWidths[i],
              height: rowHeight,
              borderColor: rgb(0, 0, 0),
              borderWidth: 1,
            });

            // Draw cell text (centered)
            const text = row[i];
            const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
            const textX = currentX + (columnWidths[i] - textWidth) / 2;

            page.drawText(text, {
              x: textX,
              y: height - currentY + (rowHeight - fontSize) / 2,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });

            currentX += columnWidths[i];
          }
          currentY += rowHeight;
        }

        return currentY;
      };

      // Helper function to add a new page with template background BUT NO CONTENT
      const addNewPage = async () => {
        const [newPage] = await pdfDoc.copyPages(pdfDoc, [0]);
        pdfDoc.addPage(newPage);
        const cleanPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];

        // CLEAR ALL EXISTING CONTENT FROM THE TEMPLATE PAGE
        cleanPage.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: height,
          color: rgb(1, 1, 1),
          opacity: 1,
        });

        return cleanPage;
      };

      // ===== VERTICAL POSITIONING CONSTANTS =====
      const firstPageHeaderHeight = 280;
      const subsequentPageHeaderHeight = 80;
      const footerHeight = 60;
      const margin = 50;
      const lineHeight = 15;
      const pageBottomMargin = footerHeight + 40;
      const sectionSpacing = 25;

      // ===== START CONTENT =====
      let currentPage = firstPage;
      let yPosition = firstPageHeaderHeight;

      // ===== EXECUTIVE SUMMARY =====
      addText(
        currentPage,
        "EXECUTIVE SUMMARY",
        margin,
        yPosition,
        16,
        true,
        "center"
      );
      yPosition += 40;

      // Create executive summary as a proper table
      const summaryData = [
        [
          "Total Population",
          (dashboardData.statistics.totalResidents || 0).toLocaleString(),
        ],
        [
          "Total Households",
          (dashboardData.statistics.totalHouseholds || 0).toLocaleString(),
        ],
        [
          "Average Household Size",
          `${dashboardData.statistics.averageHouseholdSize || 0} persons`,
        ],
        [
          "Registered Voters",
          (
            dashboardData.voterStats.find((v) => v._id === "Registered")
              ?.count || 0
          ).toLocaleString(),
        ],
        [
          "Average Age",
          `${dashboardData.ageDistribution.summary?.averageAge || 0} years`,
        ],
        [
          "Employed Residents",
          (
            dashboardData.employmentStats.find((e) => e._id === "Employed")
              ?.count || 0
          ).toLocaleString(),
        ],
      ];

      const summaryHeaders = ["Metric", "Value"];
      const summaryColWidths = [200, 150];
      const summaryTableStartX =
        (width - summaryColWidths.reduce((a, b) => a + b, 0)) / 2;

      yPosition = drawTable(
        currentPage,
        summaryData,
        summaryHeaders,
        summaryColWidths,
        summaryTableStartX,
        yPosition,
        25,
        10
      );
      yPosition += sectionSpacing;

      // ===== AGE DISTRIBUTION =====
      if (yPosition > height - 250) {
        currentPage = await addNewPage();
        yPosition = subsequentPageHeaderHeight;
      }

      addText(
        currentPage,
        "AGE DISTRIBUTION ANALYSIS",
        margin,
        yPosition,
        14,
        true,
        "center"
      );
      yPosition += 40;

      const ageHeaders = [
        "Age Group",
        "Total",
        "Male",
        "Female",
        "LGBTQ+",
        "Percent",
      ];
      const ageColWidths = [80, 60, 60, 60, 60, 60];
      const ageTableStartX =
        (width - ageColWidths.reduce((a, b) => a + b, 0)) / 2;

      const ageTableData =
        dashboardData.ageDistribution.chartData
          ?.filter((item) => item.total > 0)
          .map((item) => [
            item.group,
            (item.total || 0).toString(),
            (item.male || 0).toString(),
            (item.female || 0).toString(),
            (item.lgbtq || 0).toString(),
            `${item.percentage || 0}%`,
          ]) || [];

      const totalMale = ageTableData.reduce(
        (sum, row) => sum + parseInt(row[2] || 0),
        0
      );
      const totalFemale = ageTableData.reduce(
        (sum, row) => sum + parseInt(row[3] || 0),
        0
      );
      const totalLGBTQ = ageTableData.reduce(
        (sum, row) => sum + parseInt(row[4] || 0),
        0
      );
      const totalPopulation = totalMale + totalFemale + totalLGBTQ;

      // Add totals row
      ageTableData.push([
        "TOTAL",
        totalPopulation.toString(),
        totalMale.toString(),
        totalFemale.toString(),
        totalLGBTQ.toString(),
        "100%",
      ]);

      yPosition = drawTable(
        currentPage,
        ageTableData,
        ageHeaders,
        ageColWidths,
        ageTableStartX,
        yPosition,
        18,
        8
      );
      yPosition += sectionSpacing;

      // ===== GENDER DISTRIBUTION =====
      if (yPosition > height - 150) {
        currentPage = await addNewPage();
        yPosition = subsequentPageHeaderHeight;
      }

      addText(
        currentPage,
        "GENDER DISTRIBUTION",
        margin,
        yPosition,
        14,
        true,
        "center"
      );
      yPosition += 40;

      const genderTableData =
        dashboardData.genderStats?.map((item) => {
          const percentage = (
            (item.count / dashboardData.statistics.totalResidents) *
            100
          ).toFixed(1);
          return [
            item._id,
            item.count?.toLocaleString() || "0",
            `${percentage}%`,
          ];
        }) || [];

      const genderHeaders = ["Gender", "Count", "Percentage"];
      const genderColWidths = [120, 80, 100];
      const genderTableStartX =
        (width - genderColWidths.reduce((a, b) => a + b, 0)) / 2;

      yPosition = drawTable(
        currentPage,
        genderTableData,
        genderHeaders,
        genderColWidths,
        genderTableStartX,
        yPosition
      );
      yPosition += sectionSpacing;

      // ===== EMPLOYMENT STATUS =====
      if (yPosition > height - 150) {
        currentPage = await addNewPage();
        yPosition = subsequentPageHeaderHeight;
      }

      addText(
        currentPage,
        "EMPLOYMENT STATUS ANALYSIS",
        margin,
        yPosition,
        14,
        true,
        "center"
      );
      yPosition += 40;

      const employmentTableData =
        dashboardData.employmentStats?.map((item) => {
          const percentage = (
            (item.count / dashboardData.statistics.totalResidents) *
            100
          ).toFixed(1);
          return [
            item._id,
            item.count?.toLocaleString() || "0",
            `${percentage}%`,
          ];
        }) || [];

      const employmentHeaders = ["Employment Status", "Count", "Percentage"];
      const employmentColWidths = [150, 80, 100];
      const employmentTableStartX =
        (width - employmentColWidths.reduce((a, b) => a + b, 0)) / 2;

      yPosition = drawTable(
        currentPage,
        employmentTableData,
        employmentHeaders,
        employmentColWidths,
        employmentTableStartX,
        yPosition
      );

      const employed =
        dashboardData.employmentStats.find((e) => e._id === "Employed")
          ?.count || 0;
      const unemployed =
        dashboardData.employmentStats.find((e) => e._id === "Unemployed")
          ?.count || 0;
      const employmentRate =
        employed + unemployed > 0
          ? ((employed / (employed + unemployed)) * 100).toFixed(1)
          : 0;

      yPosition += 10;
      addText(
        currentPage,
        `Employment Rate: ${employmentRate}% (among employed + unemployed)`,
        margin,
        yPosition,
        9,
        false,
        "center"
      );
      yPosition += sectionSpacing;

      // ===== VOTER REGISTRATION =====
      if (yPosition > height - 150) {
        currentPage = await addNewPage();
        yPosition = subsequentPageHeaderHeight;
      }

      addText(
        currentPage,
        "VOTER REGISTRATION STATUS",
        margin,
        yPosition,
        14,
        true,
        "center"
      );
      yPosition += 40;

      const voterTableData =
        dashboardData.voterStats?.map((item) => {
          const percentage = (
            (item.count / dashboardData.statistics.totalResidents) *
            100
          ).toFixed(1);
          return [
            item._id,
            item.count?.toLocaleString() || "0",
            `${percentage}%`,
          ];
        }) || [];

      const voterHeaders = ["Voter Status", "Count", "Percentage"];
      const voterColWidths = [150, 80, 100];
      const voterTableStartX =
        (width - voterColWidths.reduce((a, b) => a + b, 0)) / 2;

      yPosition = drawTable(
        currentPage,
        voterTableData,
        voterHeaders,
        voterColWidths,
        voterTableStartX,
        yPosition
      );
      yPosition += sectionSpacing;

      // ===== HOUSEHOLD AND FAMILY SUMMARY =====
      if (yPosition > height - 150) {
        currentPage = await addNewPage();
        yPosition = subsequentPageHeaderHeight;
      }

      addText(
        currentPage,
        "HOUSEHOLD AND FAMILY SUMMARY",
        margin,
        yPosition,
        14,
        true,
        "center"
      );
      yPosition += 40;

      const sortedHouseholds = [...householdsWithFullDetails].sort(
        (a, b) => (b.members?.length || 0) - (a.members?.length || 0)
      );

      // Enhanced household table with family count and heads
      const householdHeaders = [
        "Address",
        "House #",
        "Families",
        "Members",
        "Heads",
        "Census Done",
      ];
      const householdColWidths = [120, 60, 60, 60, 60, 80];
      const householdTableStartX =
        (width - householdColWidths.reduce((a, b) => a + b, 0)) / 2;

      const householdTableData = sortedHouseholds.map((household) => {
        const memberCount = household.members?.length || 0;
        const familyCount = household.familyCount || 0;
        const totalHeads = household.totalHeads || 0;
        const censusComplete = household.membersWithCensus || 0;

        return [
          household.address || "N/A",
          household.houseNumber || "N/A",
          familyCount.toString(),
          memberCount.toString(),
          totalHeads.toString(),
          `${censusComplete}/${memberCount}`,
        ];
      });

      yPosition = drawTable(
        currentPage,
        householdTableData,
        householdHeaders,
        householdColWidths,
        householdTableStartX,
        yPosition,
        18,
        8
      );
      yPosition += sectionSpacing;

      // ===== DETAILED HOUSEHOLD AND FAMILY INFORMATION =====
      if (yPosition > height - 200) {
        currentPage = await addNewPage();
        yPosition = subsequentPageHeaderHeight;
      }

      addText(
        currentPage,
        "DETAILED HOUSEHOLD AND FAMILY INFORMATION",
        margin,
        yPosition,
        16,
        true,
        "center"
      );
      yPosition += 50;

      for (let i = 0; i < sortedHouseholds.length; i++) {
        const household = sortedHouseholds[i];

        if (yPosition > height - pageBottomMargin - 150) {
          currentPage = await addNewPage();
          yPosition = subsequentPageHeaderHeight;
        }

        addText(
          currentPage,
          `Household: ${household.address || "N/A"} - House #${
            household.houseNumber || "N/A"
          }`,
          margin,
          yPosition,
          12,
          true,
          "center"
        );
        yPosition += 30;

        const memberCount = household.members?.length || 0;
        const familyCount = household.familyCount || 0;
        const totalHeads = household.totalHeads || 0;
        const censusComplete = household.membersWithCensus || 0;

        // Enhanced household info with family and head count
        const householdInfoData = [
          [`Total Families: ${familyCount}`, `Total Members: ${memberCount}`],
          [
            `Family Heads: ${totalHeads}`,
            `Census Completed: ${censusComplete}/${memberCount}`,
          ],
        ];

        const householdInfoHeaders = ["Information", "Details"];
        const householdInfoColWidths = [200, 200];
        const householdInfoStartX =
          (width - householdInfoColWidths.reduce((a, b) => a + b, 0)) / 2;

        yPosition = drawTable(
          currentPage,
          householdInfoData,
          householdInfoHeaders,
          householdInfoColWidths,
          householdInfoStartX,
          yPosition,
          20,
          9
        );
        yPosition += 25;

        // Display families within the household
        if (household.families && household.families.length > 0) {
          addText(
            currentPage,
            `Families in this Household (${household.families.length})`,
            margin,
            yPosition,
            11,
            true,
            "left"
          );
          yPosition += 25;

          for (let j = 0; j < household.families.length; j++) {
            const family = household.families[j];

            if (yPosition > height - pageBottomMargin - 100) {
              currentPage = await addNewPage();
              yPosition = subsequentPageHeaderHeight;
            }

            // Family header
            addText(
              currentPage,
              `Family ${j + 1}: ${family.familyName} Family`,
              margin + 20,
              yPosition,
              10,
              true,
              "left"
            );
            yPosition += 20;

            // Family head information
            if (family.headOfFamily) {
              addText(
                currentPage,
                `Head: ${family.headOfFamily.name} ${
                  family.headOfFamily.phoneNumber
                    ? `- Contact: ${family.headOfFamily.phoneNumber}`
                    : ""
                }`,
                margin + 40,
                yPosition,
                9,
                false,
                "left"
              );
              yPosition += 25;
            }

            // Family members table
            if (family.members && family.members.length > 0) {
              const familyMemberHeaders = ["Name", "Age", "Gender", "Head"];
              const familyMemberColWidths = [120, 40, 60, 40];
              const familyMemberTableStartX =
                (width - familyMemberColWidths.reduce((a, b) => a + b, 0)) / 2;

              const familyMemberTableData = family.members.map((member) => {
                const isHead = member.isHeadOfFamily || false;
                return [
                  member.fullName || "Unknown",
                  member.age?.toString() || "N/A",
                  member.gender || "N/A",
                  isHead ? "Yes" : "No",
                ];
              });

              yPosition = drawTable(
                currentPage,
                familyMemberTableData,
                familyMemberHeaders,
                familyMemberColWidths,
                familyMemberTableStartX,
                yPosition,
                16,
                8
              );
              yPosition += 10;
            }

            // Add spacing between families
            if (j < household.families.length - 1) {
              yPosition += 5;
              currentPage.drawLine({
                start: { x: margin + 5, y: height - yPosition },
                end: { x: width - margin - 20, y: height - yPosition },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
              });
              yPosition += 22;
            }
          }
        } else {
          addText(
            currentPage,
            "No family data available",
            margin,
            yPosition,
            10,
            false,
            "center"
          );
          yPosition += 20;
        }

        // Add separator between households
        if (i < sortedHouseholds.length - 1) {
          yPosition += 15;
          currentPage.drawLine({
            start: { x: margin, y: height - yPosition },
            end: { x: width - margin, y: height - yPosition },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
          yPosition += 25;
        }
      }

      // ===== ADD PAGE NUMBERS TO ALL PAGES =====
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPages()[i];

        // Calculate text widths to prevent overlap
        const pageText = `Page ${i + 1} of ${totalPages}`;
        const docText =
          "Official Document - Barangay 646, Zone 67, District VI, Manila";

        const pageTextWidth = helveticaFont.widthOfTextAtSize(pageText, 8);
        const docTextWidth = helveticaFont.widthOfTextAtSize(docText, 8);

        // Position page number on right with proper margin
        addText(
          page,
          pageText,
          width - margin - pageTextWidth,
          height - 30,
          8,
          false
        );

        // Position document text on left with proper margin
        addText(page, docText, margin, height - 30, 8, false);
      }

      // ===== SAVE THE PDF =====
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Barangay_646_Census_Report_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("PDF generated successfully with family information");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const debugHouseholdData = async () => {
    try {
      // Test the household endpoint directly
      const testHousehold = dashboardData.householdGraph[0];
      if (testHousehold) {
        console.log("Testing household endpoint with:", testHousehold);
        const response = await axiosInstance.get(
          `/resident-data/admin/household/${encodeURIComponent(
            testHousehold.address
          )}/${testHousehold.houseNumber}`
        );
        console.log("Household endpoint response:", response.data);

        // Test individual member endpoints
        if (response.data.data.members) {
          for (let member of response.data.data.members.slice(0, 2)) {
            console.log(`Testing member ${member.userId}:`, member);
            try {
              const userResponse = await axiosInstance.get(
                `/user/${member.userId}`
              );
              console.log(`User data for ${member.userId}:`, userResponse.data);
            } catch (error) {
              console.log(
                `User endpoint failed for ${member.userId}:`,
                error.response?.data
              );
            }

            try {
              const censusResponse = await axiosInstance.get(
                `/resident-data/admin/user/${member.userId}`
              );
              console.log(
                `Census data for ${member.userId}:`,
                censusResponse.data
              );
            } catch (error) {
              console.log(
                `Census endpoint failed for ${member.userId}:`,
                error.response?.data
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Debugging failed:", error);
    }
  };

  // Chart.js configuration with interactivity
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        const chartId = chart.canvas.id;

        handleChartClick(chartId, elementIndex, datasetIndex, chart);
      }
    },
    onHover: (event, elements, chart) => {
      if (elements.length > 0) {
        chart.canvas.style.cursor = "pointer";
      } else {
        chart.canvas.style.cursor = "default";
      }
    },
  };

  const handleChartClick = (chartId, elementIndex, datasetIndex, chart) => {
    switch (chartId) {
      case "age-chart":
        const ageGroups = dashboardData.ageDistribution.chartData.map(
          (item) => item.group
        );
        const ageGroup = ageGroups[elementIndex];
        if (ageGroup) {
          setSelectedAgeGroup(ageGroup);
          const residents = filterResidentsByCriteria({
            type: "age-group",
            value: ageGroup,
          });
          setSelectedResidents(residents);
          setSelectedCategory(`Age Group: ${ageGroup}`);
          console.log(`Clicked on age group: ${ageGroup}`, residents);
        }
        break;

      case "gender-chart":
        const genderLabels = dashboardData.genderStats.map((item) => item._id);
        const gender = genderLabels[elementIndex];
        if (gender) {
          setSelectedGender(gender);
          const residents = filterResidentsByCriteria({
            type: "gender",
            value: gender,
          });
          setSelectedResidents(residents);
          setSelectedCategory(`Gender: ${gender}`);
          console.log(`Clicked on gender: ${gender}`, residents);
        }
        break;

      case "employment-chart":
        const employmentLabels = dashboardData.employmentStats.map(
          (item) => item._id
        );
        const employment = employmentLabels[elementIndex];
        if (employment) {
          const residents = filterResidentsByCriteria({
            type: "employment",
            value: employment,
          });
          setSelectedResidents(residents);
          setSelectedCategory(`Employment: ${employment}`);
          console.log(
            `Clicked on employment category: ${employment}`,
            residents
          );
        }
        break;

      case "voter-chart":
        const voterLabels = dashboardData.voterStats.map((item) => item._id);
        const voter = voterLabels[elementIndex];
        if (voter) {
          const residents = filterResidentsByCriteria({
            type: "voter",
            value: voter,
          });
          setSelectedResidents(residents);
          setSelectedCategory(`Voter Status: ${voter}`);
          console.log(`Clicked on voter category: ${voter}`, residents);
        }
        break;

      default:
        break;
    }
  };

  // Transform functions for new charts
  const transformCivilStatusData = (civilStats) => {
    if (!civilStats || !Array.isArray(civilStats)) {
      return { labels: [], datasets: [] };
    }

    const labels = civilStats.map(item => item.status || 'Unknown');
    const data = civilStats.map(item => item.count || 0);
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    };
  };

  const transformOccupationData = (occupationStats) => {
    if (!occupationStats || !Array.isArray(occupationStats)) {
      return { labels: [], datasets: [] };
    }

    const labels = occupationStats.map(item => item.occupation || 'Unknown');
    const data = occupationStats.map(item => item.count || 0);
    const colors = ['#06b6d4', '#84cc16', '#f97316', '#a855f7', '#f43f5e', '#6366f1'];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    };
  };

  const transformAgeGroupDistribution = (ageData) => {
    if (!ageData || !Array.isArray(ageData)) {
      return { labels: [], datasets: [] };
    }

    const labels = ageData.map(item => item.group || 'Unknown');
    const totalData = ageData.map(item => (item.male || 0) + (item.female || 0) + (item.lgbtq || 0));

    return {
      labels,
      datasets: [{
        label: 'Total Population',
        data: totalData,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 6,
      }],
    };
  };

  // Memoized computed data - USING ACTUAL BACKEND DATA
  const {
    ageChartConfig,
    genderChartConfig,
    employmentChartConfig,
    voterChartConfig,
    civilStatusChartConfig,
    occupationChartConfig,
    ageGroupDistributionConfig,
  } = useMemo(() => {
    const ageData = dashboardData.ageDistribution?.chartData || [];
    console.log("Processing age data:", ageData);

    // Age distribution for pyramid chart
    const ageGroups = ageData.map((item) => item?.group).filter(Boolean) || [];
    const maleData = ageData.map((item) => -(item?.male || 0)); // Negative for left side
    const femaleData = ageData.map((item) => item?.female || 0);
    const lgbtqData = ageData.map((item) => item?.lgbtq || 0);

    // Use actual backend data for charts
    const ageChartConfig = {
      labels: ageGroups,
      datasets: [
        {
          label: "Male",
          data: maleData,
          backgroundColor: MODERN_COLORS.primary,
          borderColor: MODERN_COLORS.primary,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Female",
          data: femaleData,
          backgroundColor: MODERN_COLORS.pink,
          borderColor: MODERN_COLORS.pink,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "LGBTQ+",
          data: lgbtqData,
          backgroundColor: "#9333ea", // Purple color for LGBTQ+
          borderColor: "#9333ea",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    const genderChartConfig = transformGenderData(dashboardData.genderStats);
    const employmentChartConfig = transformEmploymentData(
      dashboardData.employmentStats
    );
    const voterChartConfig = transformVoterData(dashboardData.voterStats);

    // New chart configurations
    const civilStatusChartConfig = transformCivilStatusData(dashboardData.civilStatusStats);
    const occupationChartConfig = transformOccupationData(dashboardData.occupationStats);
    const ageGroupDistributionConfig = transformAgeGroupDistribution(ageData);

    return {
      ageChartConfig,
      genderChartConfig,
      employmentChartConfig,
      voterChartConfig,
      civilStatusChartConfig,
      occupationChartConfig,
      ageGroupDistributionConfig,
    };
  }, [dashboardData]);

  // Filter households based on search
  const filteredHouseholds = useMemo(() => {
    return dashboardData.householdGraph.filter((h) =>
      `${h.address || ""} ${h.houseNumber || ""}`
        .toLowerCase()
        .includes(householdSearch.toLowerCase())
    );
  }, [dashboardData.householdGraph, householdSearch]);

  // Updated household click handler
  const handleHouseholdClick = async (household) => {
    try {
      console.log("Clicked household:", household);
      setSelectedHousehold(null);

      // Use the new endpoint
      const response = await axiosInstance.get(
        `/resident-data/admin/complete-household/${encodeURIComponent(
          household.address
        )}/${household.houseNumber}`
      );

      console.log("Complete household API response:", response.data);

      const householdData = response.data.data;

      // Format the data for the modal
      const enhancedHouseholdData = {
        address: householdData.address,
        houseNumber: householdData.houseNumber,
        totalMembers: householdData.totalMembers,
        membersWithCensus: householdData.membersWithCensus,
        membersAnswered: householdData.membersAnswered,
        householdType: householdData.householdType,
        headOfFamily: householdData.headOfFamily,
        members: householdData.members,
        families: householdData.families,
        summary: householdData.summary,
      };

      console.log("Enhanced household data for modal:", enhancedHouseholdData);
      setSelectedHousehold(enhancedHouseholdData);
    } catch (error) {
      console.error("Failed to fetch household details:", error);
      console.error("Error details:", error.response?.data);

      // Fallback to basic data
      const fallbackHousehold = {
        address: household.address,
        houseNumber: household.houseNumber,
        totalMembers: household.members?.length || 0,
        membersWithCensus:
          household.members?.filter((m) => m.hasCensusData)?.length || 0,
        householdType: "Residential",
        headOfFamily: household.headOfFamily,
        members: household.members || [],
        families: groupMembersByFamily(household.members || []),
        error: "Failed to load complete details",
      };

      console.log("Using fallback household data:", fallbackHousehold);
      setSelectedHousehold(fallbackHousehold);
    }
  };

  // Helper function to calculate age from birthdate
  const calculateAgeFromBirthdate = (birthdate) => {
    if (!birthdate) return "N/A";
    try {
      const birthDate = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    } catch (error) {
      return "N/A";
    }
  };

  // Helper for resident image click
  const handleResidentImageClick = (imageUrl) => {
    if (imageUrl && imageUrl !== "https://via.placeholder.com/150") {
      setIdImageUrl(imageUrl);
      setShowIDViewer(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 ">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Census Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Modern demographic insights and household intelligence
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FileText size={18} />
                )}
                {exporting ? "Generating PDF..." : "Export Report"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Date Filter */}
        <div className="mb-8">
          <DateFilter
            dateRange={dateRange}
            setDateRange={setDateRange}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            showCustomDateRange={showCustomDateRange}
            setShowCustomDateRange={setShowCustomDateRange}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Residents
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(
                    dashboardData.adminTotals?.totalUsers ?? 0
                  ).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Households
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(
                    dashboardData.adminTotals?.totalHouseholds ?? 0
                  ).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {dashboardData.statistics.growthTrend?.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm ${
                      dashboardData.statistics.growthTrend?.trend === "up"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dashboardData.statistics.growthTrend?.growth || 0} (
                    {dashboardData.statistics.growthTrend?.growthPercentage ||
                      0}
                    %)
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                <Home className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Registered Voters
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(
                    dashboardData.adminTotals?.totalRegisteredVoters ?? 0
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  residents registered as voters
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Median Age</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.ageDistribution.summary?.medianAge || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">years</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Age Distribution Pyramid */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Population Pyramid
                </h3>
                <p className="text-gray-600">Age distribution by gender</p>
              </div>
              {selectedAgeGroup && (
                <div className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">
                  Selected: {selectedAgeGroup}
                </div>
              )}
            </div>

            <div className="h-96">
              {ageChartConfig.labels && ageChartConfig.labels.length > 0 ? (
                <Bar
                  id="age-chart"
                  ref={ageChartRef}
                  data={ageChartConfig}
                  options={{
                    ...chartOptions,
                    indexAxis: "y",
                    scales: {
                      x: {
                        stacked: true,
                        ticks: {
                          callback: function (value) {
                            return Math.abs(value);
                          },
                        },
                        grid: {
                          color: "#f3f4f6",
                        },
                      },
                      y: {
                        stacked: true,
                        grid: {
                          color: "#f3f4f6",
                        },
                      },
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: function (context) {
                            const value = Math.abs(context.parsed.x);
                            return `${context.dataset.label}: ${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No age distribution data available
                </div>
              )}
            </div>

            {/* Age Distribution Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.ageDistribution.summary?.averageAge || 0}
                </p>
                <p className="text-xs text-gray-600">Average Age</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.ageDistribution.summary?.youthPercentage || 0}%
                </p>
                <p className="text-xs text-gray-600">Youth (0-14)</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.ageDistribution.summary?.seniorPercentage || 0}
                  %
                </p>
                <p className="text-xs text-gray-600">Seniors (65+)</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.ageDistribution.chartData?.reduce(
                    (acc, group) => acc + (group?.lgbtq || 0),
                    0
                  ) || 0}
                </p>
                <p className="text-xs text-gray-600">LGBTQ+</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Click on any age group to view residents
              </p>
            </div>
          </div>

          {/* Household Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Household Distribution
                </h3>
                <p className="text-gray-600">
                  Click to explore household details
                </p>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search households..."
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full lg:w-64"
                  value={householdSearch}
                  onChange={(e) => setHouseholdSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="h-115 overflow-y-auto">
              {filteredHouseholds.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredHouseholds.map((household, index) => (
                    <div
                      key={household.id || index}
                      onClick={() => handleHouseholdClick(household)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {household.address || "Unknown Address"}{" "}
                            {household.houseNumber || ""}
                          </h4>
                          {household.membersWithCensus !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              {household.membersWithCensus} census completed
                            </p>
                          )}
                          {/* Show family count */}
                          {household.members && (
                            <p className="text-xs text-blue-600 mt-1">
                              {groupMembersByFamily(household.members).length}{" "}
                              {groupMembersByFamily(household.members)
                                .length === 1
                                ? "family"
                                : "families"}{" "}
                              in this household
                            </p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2 text-sm text-gray-600 justify-end">
                            {household.headOfFamily ? (
                              <>
                                <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {household.headOfFamily.name}
                                </span>
                              </>
                            ) : (
                              <>
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-500">
                                  No head assigned
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-indigo-600 mt-1 font-medium">
                            Click for details
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No household data available
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 gap-2">
              <span>{filteredHouseholds.length} households displayed</span>
              <span>Click any household for details</span>
            </div>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Gender Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">
                Gender Distribution
              </h4>
            </div>
            <div className="h-64">
              {genderChartConfig.labels &&
              genderChartConfig.labels.length > 0 ? (
                <Doughnut
                  id="gender-chart"
                  ref={genderChartRef}
                  data={genderChartConfig}
                  options={{
                    ...chartOptions,
                    cutout: "60%",
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No gender data available
                </div>
              )}
            </div>
            {selectedGender && (
              <div className="mt-2 text-center text-sm text-blue-600">
                Selected: {selectedGender}
              </div>
            )}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">
                Click on any segment to view residents
              </p>
            </div>
          </div>

          {/* Employment Status */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Employment Status</h4>
            </div>
            <div className="h-64">
              {employmentChartConfig.labels &&
              employmentChartConfig.labels.length > 0 ? (
                <Pie
                  id="employment-chart"
                  ref={employmentChartRef}
                  data={employmentChartConfig}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No employment data available
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">
                Click on any segment to view residents
              </p>
            </div>
          </div>

          {/* Voter Registration */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Vote className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">
                Voter Registration
              </h4>
            </div>
            <div className="h-64">
              {voterChartConfig.labels && voterChartConfig.labels.length > 0 ? (
                <Bar
                  id="voter-chart"
                  ref={voterChartRef}
                  data={voterChartConfig}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "#f3f4f6",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No voter data available
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">
                Click on any bar to view residents
              </p>
            </div>
          </div>
        </div>

        {/* Additional Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Civil Status Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-600" />
              <h4 className="font-semibold text-gray-900">Civil Status</h4>
            </div>
            <div className="h-64">
              {civilStatusChartConfig.labels && civilStatusChartConfig.labels.length > 0 ? (
                <Pie
                  data={civilStatusChartConfig}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No civil status data available
                </div>
              )}
            </div>
          </div>

          {/* Occupation Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-gray-900">Occupations</h4>
            </div>
            <div className="h-64">
              {occupationChartConfig.labels && occupationChartConfig.labels.length > 0 ? (
                <Doughnut
                  data={occupationChartConfig}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No occupation data available
                </div>
              )}
            </div>
          </div>

          {/* Age Group Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Age Group Distribution</h4>
            </div>
            <div className="h-64">
              {ageGroupDistributionConfig.labels && ageGroupDistributionConfig.labels.length > 0 ? (
                <Bar
                  data={ageGroupDistributionConfig}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#f3f4f6',
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No age group data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Household Details Modal */}
      {selectedHousehold && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    Household Details
                  </h3>
                  <p className="text-gray-600 truncate">
                    {selectedHousehold.address} {selectedHousehold.houseNumber}
                  </p>
                  {selectedHousehold.error && (
                    <p className="text-sm text-red-600 mt-1">
                      {selectedHousehold.error}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedHousehold(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Household Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {selectedHousehold.totalMembers}
                  </p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedHousehold.householdType}
                  </p>
                  <p className="text-sm text-gray-600">Household Type</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {selectedHousehold.membersAnswered || 0}
                  </p>
                  <p className="text-sm text-gray-600">Answered Census</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {selectedHousehold.families?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Families</p>
                </div>
              </div>

              {/* Head of Household Information */}
              {selectedHousehold.headOfFamily && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Head of Household: {selectedHousehold.headOfFamily.name}
                      </h4>
                      {selectedHousehold.headOfFamily.phoneNumber && (
                        <p className="text-sm text-gray-600">
                          Contact: {selectedHousehold.headOfFamily.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Families Section */}
              <div className="space-y-6">
                <h4 className="font-semibold text-gray-900 text-lg">
                  Families in this Household
                </h4>

                {selectedHousehold.families &&
                selectedHousehold.families.length > 0 ? (
                  selectedHousehold.families.map((family, familyIndex) => (
                    <div
                      key={familyIndex}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      {/* Family Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div>
                          <h5 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            {family.familyName} Family
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {family.members.length}{" "}
                            {family.members.length === 1 ? "member" : "members"}
                          </p>
                        </div>

                        {family.headOfFamily && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <Crown className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Head: {family.headOfFamily.name}
                              </span>
                            </div>
                            {family.headOfFamily.phoneNumber && (
                              <div className="relative group">
                                <p className="text-xs text-yellow-600 mt-1 cursor-pointer">
                                  Contact:{" "}
                                  {family.headOfFamily.phoneNumber.length > 25
                                    ? family.headOfFamily.phoneNumber.slice(
                                        0,
                                        25
                                      ) + "..."
                                    : family.headOfFamily.phoneNumber}
                                </p>

                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                  {family.headOfFamily.phoneNumber}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Family Members */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {family.members.map((member, memberIndex) => {
                          const memberImage = getResidentImage(member);
                          return (
                            <div
                              key={memberIndex}
                              className={`p-3 rounded-lg border ${
                                member.isHeadOfFamily
                                  ? "bg-yellow-50 border-yellow-200 shadow-sm"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Member Image */}
                                <div className="flex-shrink-0">
                                  {memberImage ? (
                                    <img
                                      src={memberImage}
                                      alt={member.fullName}
                                      className="w-10 h-10 rounded-lg object-cover border cursor-pointer"
                                      onClick={() =>
                                        handleResidentImageClick(memberImage)
                                      }
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        const fallback =
                                          e.target.parentElement.querySelector(
                                            ".image-fallback"
                                          );
                                        if (fallback)
                                          fallback.style.display = "flex";
                                      }}
                                      title="Click to enlarge"
                                    />
                                  ) : null}
                                  <div
                                    className={`w-10 h-10 rounded-lg border bg-gray-100 flex items-center justify-center image-fallback ${
                                      memberImage ? "hidden" : "flex"
                                    }`}
                                  >
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                </div>

                                {/* Member Details */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {member.fullName}
                                    </span>
                                    {member.isHeadOfFamily && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Head
                                      </span>
                                    )}
                                    {!member.hasCensusData && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                        No Census
                                      </span>
                                    )}
                                  </div>

                                  {/* Basic Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {member.age || "N/A"} years old
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Heart className="w-3 h-3" />
                                      <span>{member.gender}</span>
                                    </div>

                                    {member.civilStatus &&
                                      member.civilStatus !==
                                        "Not Specified" && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <span>
                                            Status: {member.civilStatus}
                                          </span>
                                        </div>
                                      )}

                                    {member.phoneNumber &&
                                      member.phoneNumber !== "N/A" && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <Phone className="w-3 h-3" />
                                          <div className="relative group cursor-pointer">
                                            <span>
                                              {member.phoneNumber.length > 17
                                                ? member.phoneNumber.slice(
                                                    0,
                                                    17
                                                  ) + "..."
                                                : member.phoneNumber}
                                            </span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                              {member.phoneNumber}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                  </div>

                                  {/* Occupation and Employment */}
                                  {(member.occupation &&
                                    member.occupation !== "Not Specified") ||
                                  (member.employmentStatus &&
                                    member.employmentStatus !==
                                      "Not Specified") ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
                                      {member.occupation &&
                                        member.occupation !==
                                          "Not Specified" && (
                                          <div className="flex items-center gap-2 text-gray-500">
                                            <Briefcase className="w-3 h-3" />
                                            <span>{member.occupation}</span>
                                          </div>
                                        )}
                                      {member.employmentStatus &&
                                        member.employmentStatus !==
                                          "Not Specified" && (
                                          <div className="text-gray-500">
                                            Employment:{" "}
                                            {member.employmentStatus}
                                          </div>
                                        )}
                                    </div>
                                  ) : null}

                                  {/* Footer */}
                                  <div className="flex justify-between items-center mt-2">
                                    <div className="text-xs text-gray-500">
                                      {member.hasCensusData ? (
                                        <span className="text-green-600">
                                          ✓ Census Complete
                                        </span>
                                      ) : member.alreadyAnswered ? (
                                        <span className="text-blue-600">
                                          ✓ Registered
                                        </span>
                                      ) : (
                                        <span className="text-yellow-600">
                                          ⚠ No Census Data
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        member.voterStatus === "Registered"
                                          ? "bg-green-100 text-green-800"
                                          : member.voterStatus ===
                                            "Pre-Registered"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {member.voterStatus || "Not Specified"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No family data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Residents List Modal - FIXED VERSION */}
      {selectedResidents && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    Residents - {selectedCategory}
                  </h3>
                  <p className="text-gray-600">
                    {selectedResidents.length} residents found
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedResidents(null);
                    setSelectedCategory("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedResidents.map((resident, index) => {
                  const residentImage = getResidentImage(resident);
                  const fullName =
                    resident.fullName ||
                    `${resident.firstName || ""} ${
                      resident.lastName || ""
                    }`.trim() ||
                    "Unknown";

                  const phoneNumber =
                    resident.phoneNumber ||
                    resident.userId?.phoneNumber ||
                    resident.user?.phoneNumber ||
                    "N/A";

                  const address =
                    resident.address ||
                    resident.userId?.address ||
                    resident.user?.address ||
                    "";

                  const houseNumber =
                    resident.houseNumber ||
                    resident.userId?.houseNumber ||
                    resident.user?.houseNumber ||
                    "";

                  return (
                    <div
                      key={resident._id || resident.id || index}
                      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
                    >
                      <div className="flex gap-4">
                        {/* Resident Image - FIXED */}
                        <div className="flex-shrink-0">
                          {residentImage ? (
                            <img
                              src={residentImage}
                              alt={fullName}
                              className="w-12 h-12 rounded-lg object-cover border cursor-pointer"
                              onClick={() =>
                                handleResidentImageClick(residentImage)
                              }
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = "flex";
                              }}
                              title="Click to enlarge"
                            />
                          ) : null}
                          <div
                            className={`w-12 h-12 rounded-lg border bg-gray-100 flex items-center justify-center ${
                              residentImage ? "hidden" : "flex"
                            }`}
                          >
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>

                        {/* Resident Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 truncate">
                              {fullName}
                            </span>
                            {resident.isHeadOfFamily && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1 flex-shrink-0">
                                <Crown className="w-3 h-3" />
                                Head
                              </span>
                            )}
                          </div>

                          {/* Resident Information Grid */}
                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {resident.age ||
                                  calculateAgeFromBirthdate(
                                    resident.birthdate
                                  )}{" "}
                                years old
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Heart className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {resident.sex ||
                                  resident.gender ||
                                  "Not Specified"}
                              </span>
                            </div>
                            <div className="truncate">
                              Status: {resident.civilStatus || "Not Specified"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {resident.occupation || "Not Specified"}
                              </span>
                            </div>
                            <div className="truncate">
                              Employment:{" "}
                              {resident.employmentStatus || "Not Specified"}
                            </div>
                            {phoneNumber && phoneNumber !== "N/A" && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <div className="relative group inline-block max-w-[120px]">
                                  <span className="truncate block">
                                    {phoneNumber.length > 20
                                      ? phoneNumber.slice(0, 20) + "..."
                                      : phoneNumber}
                                  </span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg z-10">
                                    {phoneNumber}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Address */}
                          {(address || houseNumber) && (
                            <div className="mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {address} {houseNumber}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                                resident.voterStatus === "Registered"
                                  ? "bg-green-100 text-green-800"
                                  : resident.voterStatus === "Pre-Registered"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {resident.voterStatus || "Not Specified"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedResidents.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No residents found in this category
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Valid ID Image Viewer Modal */}
      {showIDViewer && (
        <IDImageViewer
          imageUrl={idImageUrl}
          onClose={() => setShowIDViewer(false)}
        />
      )}
    </div>
  );
};

export default Reports;
