"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface ChartData {
  date: string;
  reserve: number | null;
  price: number | null;
}

interface ExchangeReserveChartProps {
  data: ChartData[];
}

// 날짜 포맷 함수
function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${year}.${month}.${day}`;
}

// 숫자 포맷 함수
function formatNumber(num: number | null) {
  if (num === null) return "N/A";
  return num.toLocaleString();
}

export default function ExchangeReserveChart({
  data,
}: ExchangeReserveChartProps) {
  // 데이터를 날짜순으로 정렬 (과거 -> 최신)
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const customTooltipFormatter = (value: ValueType, name: NameType) => {
    if (typeof value !== "number") return ["N/A", name];
    if (name === "가격") return [`$${formatNumber(value)}`, name];
    return [formatNumber(value), name];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={sortedData}
        margin={{
          top: 20,
          right: 50,
          left: 50,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="date"
          stroke="#666"
          tick={{ fill: "#666" }}
          tickFormatter={formatDate}
          minTickGap={50}
        />
        <YAxis
          yAxisId="left"
          stroke="#4B7BF5"
          tick={{ fill: "#666" }}
          domain={["auto", "auto"]}
          tickFormatter={(value) => formatNumber(value)}
          label={{
            value: "거래소 보유량",
            angle: -90,
            position: "insideLeft",
            fill: "#666",
            style: { textAnchor: "middle" },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#E8B862"
          tick={{ fill: "#666" }}
          domain={["auto", "auto"]}
          tickFormatter={(value) => `$${formatNumber(value)}`}
          label={{
            value: "가격 (USD)",
            angle: 90,
            position: "insideRight",
            fill: "#666",
            style: { textAnchor: "middle" },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#333",
            border: "none",
            borderRadius: "4px",
          }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#fff" }}
          formatter={customTooltipFormatter}
          labelFormatter={formatDate}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="reserve"
          stroke="#4B7BF5"
          name="거래소 보유량"
          dot={false}
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="price"
          stroke="#E8B862"
          name="가격"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
