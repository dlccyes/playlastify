import React, { useEffect, useRef } from 'react';
import { ArtistData } from '../types';

interface ArtistPieChartProps {
  data: ArtistData[];
  title: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const ArtistPieChart: React.FC<ArtistPieChartProps> = ({ 
  data, 
  title, 
  className = '' 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Load Google Charts if not already loaded
    if (!window.google || !window.google.charts) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        window.google.charts.load('current', { 'packages': ['corechart'] }).then(() => {
          drawPie();
        }).catch((error: any) => {
          console.error('Failed to load corechart:', error);
        });
      };
      document.head.appendChild(script);
    } else {
      window.google.charts.load('current', { 'packages': ['corechart'] }).then(() => {
        drawPie();
      }).catch((error: any) => {
        console.error('Failed to load corechart:', error);
      });
    }
  }, [data]);

  const drawPie = () => {
    if (!chartRef.current || !window.google) return;

    // Clear previous chart
    chartRef.current.innerHTML = '';

    // Convert data to format expected by Google Charts
    const dataArr = [['Artist', 'Tracks']];
    data.forEach(item => {
      dataArr.push([item.artist, item.count.toString()]);
    });

    const options = {
      width: 676,
      pieHole: 0.2,
      backgroundColor: {
        fill: 'transparent',
      },
      legend: {
        textStyle: {
          color: '#fff'
        },
        pagingTextStyle: {
          color: '#ffd8d2'
        },
        scrollArrows: {
          activeColor: '#ffd8d2'
        }
      },
      sliceVisibilityThreshold: .0041, // smaller than this → others
    };

    try {
      const chart = new window.google.visualization.PieChart(chartRef.current);
      const dataTable = window.google.visualization.arrayToDataTable(dataArr);
      chart.draw(dataTable, options);
    } catch (error) {
      console.error('Error drawing pie chart:', error);
      // Fallback: show data as text
      if (chartRef.current) {
        chartRef.current.innerHTML = `
          <div style="color: white; padding: 20px;">
            <h4>Artist Distribution (Chart failed to load)</h4>
            <div>Total Artists: ${data.length}</div>
            <div>Top 5: ${data.slice(0, 5).map(a => `${a.artist} (${a.count})`).join(', ')}</div>
          </div>
        `;
      }
    }
  };

  return (
    <div className={className} style={{ width: '100%', height: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div ref={chartRef} style={{ width: '676px', height: '400px' }} />
    </div>
  );
};

export default ArtistPieChart; 