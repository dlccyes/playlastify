import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DateData } from '../types';

interface DateLineChartProps {
  data: DateData[];
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  className?: string;
}

const DateLineChart: React.FC<DateLineChartProps> = ({ 
  data, 
  title, 
  xAxisLabel, 
  yAxisLabel, 
  className = '' 
}) => {
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date + '-01').toLocaleDateString('en-US', { 
      year: '2-digit', 
      month: 'short' 
    })
  }));

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-black/80 p-3 rounded-lg border border-gray-600">
          <p className="text-white font-semibold">{label}</p>
          <p className="text-gray-300">{payload[0].value} tracks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-black/30 rounded-lg p-4 sm:p-6 ${className}`}>
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white">{title}</h3>
      <div className="w-full h-[250px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" />
          <XAxis 
            dataKey="formattedDate"
            stroke="#fff"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#fff"
            fontSize={12}
            label={{ 
              value: yAxisLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#fff' }
            }}
          />
          <Tooltip content={renderCustomTooltip} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ffd8d2"
            strokeWidth={2}
            dot={{ fill: '#ffd8d2', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ffd8d2', strokeWidth: 2 }}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DateLineChart; 