/** @format */
import React from "react";
import { Bar } from "react-chartjs-2";
import Loader from "../../../components/Loader";

// Modern color palettes from Reports.jsx
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

const AgeGroupChart = ({ censusStats, loading }) => {
  // Transform age data for pyramid chart (from Reports.jsx)
  const transformAgeData = (ageData) => {
    if (!ageData || !Array.isArray(ageData)) {
      return { labels: [], datasets: [] };
    }

    const ageGroups = ageData.map((item) => item?.name || item?.group).filter(Boolean) || [];
    const maleData = ageData.map((item) => -(item?.count || item?.male || 0)); // Negative for left side
    const femaleData = ageData.map((item) => item?.count || item?.female || 0);

    return {
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
      ],
    };
  };

  const ageChartConfig = transformAgeData(censusStats.ageGroups);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const value = Math.abs(context.parsed.x);
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          callback: function (value) {
            return Math.abs(value);
          },
        },
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
        },
        title: {
          display: true,
          text: 'Number of Residents',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
      y: {
        stacked: true,
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
        },
        title: {
          display: true,
          text: 'Age Groups',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
    },
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const ageGroup = ageChartConfig.labels[elementIndex];
        console.log(`Clicked on age group: ${ageGroup}`);
        // You can add interactivity here if needed
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

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Calculate summary statistics
  const totalResidents = censusStats.ageGroups.reduce((sum, group) => sum + (group.count || 0), 0);
  const youthCount = censusStats.ageGroups
    .filter(group => {
      const ageRange = group.name || group.group;
      return ageRange.includes('0-14') || ageRange.includes('Children') || ageRange.includes('Youth');
    })
    .reduce((sum, group) => sum + (group.count || 0), 0);
  
  const seniorCount = censusStats.ageGroups
    .filter(group => {
      const ageRange = group.name || group.group;
      return ageRange.includes('65+') || ageRange.includes('Senior');
    })
    .reduce((sum, group) => sum + (group.count || 0), 0);

  const youthPercentage = totalResidents > 0 ? ((youthCount / totalResidents) * 100).toFixed(1) : 0;
  const seniorPercentage = totalResidents > 0 ? ((seniorCount / totalResidents) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Population Pyramid
        </h3>
        <span className="text-sm text-gray-500">Age distribution by gender</span>
      </div>
      
      <div className="h-80">
        {ageChartConfig.labels && ageChartConfig.labels.length > 0 ? (
          <Bar 
            data={ageChartConfig} 
            options={chartOptions}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No age group data available
          </div>
        )}
      </div>

      {/* Age Group Statistics - Similar to Reports.jsx */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {totalResidents}
          </p>
          <p className="text-sm text-gray-600">Total Residents</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {youthPercentage}%
          </p>
          <p className="text-sm text-gray-600">Youth (0-14)</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {seniorPercentage}%
          </p>
          <p className="text-sm text-gray-600">Seniors (65+)</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {censusStats.ageGroups.length}
          </p>
          <p className="text-sm text-gray-600">Age Groups</p>
        </div>
      </div>

      {/* Interactive Hint */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          Click on any age group for detailed information
        </p>
      </div>
    </div>
  );
};

export default AgeGroupChart;