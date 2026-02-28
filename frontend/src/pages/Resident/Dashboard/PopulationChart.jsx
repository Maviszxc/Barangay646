/** @format */
import React from "react";
import { Line } from "react-chartjs-2";
import Loader from "../../../components/Loader";

const PopulationChart = ({ populationData, loading }) => {
  // Process the data from your API response
  const processChartData = () => {
    if (!populationData?.statistics) {
      return null;
    }

    const stats = populationData.statistics;
    const monthlyData = stats.monthlyGrowth || [];
    
    // Use all monthly data, even if some are zero (shows the progression)
    const chartMonths = monthlyData.length > 0 ? monthlyData : [
      // Fallback: create a single point with current data
      {
        month: new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        population: stats.currentStats?.totalPopulation || 0,
        cumulative: stats.currentStats?.totalPopulation || 0
      }
    ];

    return {
      labels: chartMonths.map(item => item.month),
      datasets: [
        {
          label: "Total Population",
          data: chartMonths.map(item => item.cumulative),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          tension: 0.3,
          fill: true,
          borderWidth: 3,
          pointBackgroundColor: "#6366f1",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: "Monthly Growth",
          data: chartMonths.map(item => item.population),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          fill: false,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ]
    };
  };

  const chartData = processChartData();
  const stats = populationData?.statistics;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toLocaleString();
            if (label === 'Monthly Growth') {
              return `${label}: +${value}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
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
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Timeline',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Population Growth Trends
        </h3>
        <div className="text-right">
          <span className="text-sm text-gray-500 block">Real-time Analytics</span>
          {stats?.lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated: {new Date(stats.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="h-80">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No population data available
          </div>
        )}
      </div>

      {/* Current Statistics Cards */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <StatCard
          value={stats?.currentStats?.totalPopulation || 0}
          label="Total Population"
          color="blue"
          format="number"
          icon="👥"
        />
        <StatCard
          value={stats?.currentStats?.totalHouseholds || 0}
          label="Total Households"
          color="purple"
          format="number"
          icon="🏠"
        />
        <StatCard
          value={stats?.currentStats?.averageHouseholdSize || 0}
          label="Avg. Household Size"
          color="green"
          format="decimal"
          icon="📊"
        />
        <StatCard
          value={stats?.currentStats?.growthRate || 0}
          label="Growth Rate"
          color="amber"
          format="percent"
          icon="📈"
        />
      </div>

      {/* Quick Stats */}
      {stats?.quickStats && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Demographic Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
              <div className="text-sm text-gray-600">Primary Gender</div>
              <div className="font-bold text-gray-800 text-lg">
                {stats.quickStats.gender.main}
              </div>
              <div className="text-xs text-blue-600 font-semibold">
                {stats.quickStats.gender.percentage}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-1">🎂</div>
              <div className="text-sm text-gray-600">Dominant Age Group</div>
              <div className="font-bold text-gray-800 text-lg">
                {stats.quickStats.age.main}
              </div>
              <div className="text-xs text-green-600 font-semibold">
                {stats.quickStats.age.percentage}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-1">💼</div>
              <div className="text-sm text-gray-600">Employment Status</div>
              <div className="font-bold text-gray-800 text-lg">
                {stats.quickStats.employment.main}
              </div>
              <div className="text-xs text-purple-600 font-semibold">
                {stats.quickStats.employment.percentage}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced StatCard component with icons
const StatCard = ({ value, label, color = "blue", format = "number", icon }) => {
  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", label: "text-blue-600", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", label: "text-purple-600", border: "border-purple-200" },
    green: { bg: "bg-green-50", text: "text-green-700", label: "text-green-600", border: "border-green-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", label: "text-amber-600", border: "border-amber-200" },
  };

  const { bg, text, label: labelColor, border } = colorClasses[color];

  const formattedValue = format === 'percent' 
    ? `${value}%` 
    : format === 'decimal'
    ? typeof value === 'number' ? value.toFixed(1) : value
    : typeof value === 'number' 
      ? value.toLocaleString() 
      : value;

  return (
    <div className={`${bg} p-4 rounded-lg border ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${text}`}>
            {formattedValue}
          </div>
          <div className={`text-sm ${labelColor} font-medium`}>
            {label}
          </div>
        </div>
        {icon && <div className="text-2xl opacity-80">{icon}</div>}
      </div>
    </div>
  );
};

export default PopulationChart;