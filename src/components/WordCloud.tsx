import React, { useEffect, useRef } from 'react';
import { GenreData } from '../types';

interface WordCloudProps {
  data: GenreData[];
  title: string;
  className?: string;
}

declare global {
  interface Window {
    anychart: any;
    $: any;
  }
}

const WordCloud: React.FC<WordCloudProps> = ({ 
  data, 
  title, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const scriptsLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Prevent multiple script loading
    if (scriptsLoadedRef.current) {
      drawCloud();
      return;
    }

    // Load AnyChart only once
    const script = document.createElement('script');
    script.src = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-core.min.js';
    script.onload = () => {
      const wordCloudScript = document.createElement('script');
      wordCloudScript.src = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-tag-cloud.min.js';
      wordCloudScript.onload = () => {
        scriptsLoadedRef.current = true;
        drawCloud();
      };
      document.head.appendChild(wordCloudScript);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup chart instance
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        } catch (e) {
          console.warn('Error disposing chart:', e);
        }
      }
    };
  }, [data]);

  const drawCloud = () => {
    if (!containerRef.current || !window.anychart) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.dispose();
      } catch (e) {
        console.warn('Error disposing previous chart:', e);
      }
    }

    // Clear container completely
    containerRef.current.innerHTML = '';

    // Convert data to AnyChart format (EXACTLY like the original)
    const cloudData = data.map(item => ({ "x": item.genre, "value": item.count }));

    // Use the EXACT same AnyChart configuration from the original charts.js
    window.anychart.onDocumentReady(() => {
      window.anychart.theme(window.anychart.themes.darkGlamour);
      window.anychart.theme(window.anychart.themes.darkTurquoise);

      let chart = window.anychart.tagCloud(cloudData);

      // Set the chart title (empty like original)
      chart.title('');
      
      // Set array of angles, by which words will be placed (exactly like original)
      chart.angles([0]);
      
      // Enable color range
      // Set color range length (exactly like original)
      chart.colorRange().length('80%');
      
      // Background settings (exactly like original)
      chart.background().fill('transparent');
      chart.background().stroke("0 transparent");
      chart.background().corners(20);
      
      // Store chart instance for cleanup
      chartInstanceRef.current = chart;
      
      // Display chart
      chart.container(containerRef.current);
      chart.draw();
      
      // Remove credits (exactly like original)
      const credits = document.querySelector('.anychart-credits');
      if (credits) {
        credits.innerHTML = '<span class="anychart-credits-text">made with AnyChart</span>';
      }
    });
  };

  return (
    <div className={`bg-black/30 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
      <div 
        ref={containerRef} 
        className="w-full h-80 border border-white/10 rounded-lg"
        style={{ position: 'relative', overflow: 'hidden' }}
      />
    </div>
  );
};

export default WordCloud; 