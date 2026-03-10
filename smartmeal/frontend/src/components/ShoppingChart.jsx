/**
 * ShoppingChart Component
 * Renders Pie chart (status distribution) and Bar chart (source breakdown)
 * using Chart.js
 */
import React, { useRef, useEffect } from 'react';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PieController, BarController } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PieController, BarController);

function ShoppingChart({ stats }) {
  const pieRef = useRef(null);
  const barRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    if (!pieRef.current || !barRef.current) return;

    if (pieChartRef.current) pieChartRef.current.destroy();
    if (barChartRef.current) barChartRef.current.destroy();

    const pending  = stats.pending  || 0;
    const bought   = stats.bought   || 0;
    const manual   = stats.source_breakdown?.manual   || 0;
    const mealPlan = stats.source_breakdown?.meal_plan || 0;

    // Pie Chart: Status Distribution
    pieChartRef.current = new Chart(pieRef.current.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['Pending', 'Bought'],
        datasets: [{
          data: [pending, bought],
          backgroundColor: ['#f59e0b', '#059669'],
          borderColor: ['#fff', '#fff'],
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, font: { size: 14 } } },
          title: { display: true, text: 'Shopping Status Distribution', font: { size: 16 } },
        },
      },
    });

    // Bar Chart: Source Breakdown
    barChartRef.current = new Chart(barRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Manual', 'Meal Plan'],
        datasets: [{
          label: 'Items',
          data: [manual, mealPlan],
          backgroundColor: ['#059669', '#047857'],
          borderColor: ['#047857', '#065f46'],
          borderWidth: 1,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Items by Source', font: { size: 16 } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, max: Math.max(manual, mealPlan) + 1 || 5 },
        },
      },
    });

    return () => {
      if (pieChartRef.current) pieChartRef.current.destroy();
      if (barChartRef.current) barChartRef.current.destroy();
    };
  }, [stats]);

  return (
    <div className="charts-section">
      <div className="card chart-card">
        <div className="card-header"><h2>📊 Status Overview</h2></div>
        <div className="card-body">
          <div className="chart-container"><canvas ref={pieRef}></canvas></div>
        </div>
      </div>
      <div className="card chart-card">
        <div className="card-header"><h2>📈 Source Breakdown</h2></div>
        <div className="card-body">
          <div className="chart-container"><canvas ref={barRef}></canvas></div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingChart;
