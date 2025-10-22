"use client";

import { useState, useEffect } from "react";
import ExchangeReserveChart from "./ExchangeReserveChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ChartData {
  date: string;
  reserve: number | null;
  price: number | null;
}

const EXCHANGE_OPTIONS = [
  { value: "all_exchange", label: "전체" },
  { value: "binance", label: "바이낸스" },
  { value: "coinbase_advanced", label: "코인베이스 어드밴스드" },
];

const DATE_OPTIONS = [
  { value: "30", label: "1개월", days: 30 },
  { value: "90", label: "3개월", days: 90 },
  { value: "180", label: "6개월", days: 180 },
];

export default function ChartControls() {
  const [selectedExchange, setSelectedExchange] = useState("all_exchange");
  const [selectedDateRange, setSelectedDateRange] = useState("30");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    };

    return {
      from: formatDate(pastDate),
      to: formatDate(today),
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const selectedDateOption = DATE_OPTIONS.find(
        (option) => option.value === selectedDateRange
      );
      const dateRange = getDateRange(selectedDateOption?.days || 30);

      const params = new URLSearchParams({
        exchange: selectedExchange,
        window: "day",
        from: dateRange.from,
        limit: "100",
      });

      const res = await fetch(`/api/cryptoquant?${params}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.error || "Failed to fetch data");
      }

      const data = await res.json();
      setChartData(data.result?.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedExchange, selectedDateRange]);

  return (
    <div className="space-y-4">
      <Card className="dark:bg-zinc-950">
        <CardHeader>
          <CardTitle>차트 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>거래소</Label>
              <Select
                value={selectedExchange}
                onValueChange={setSelectedExchange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="거래소를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {EXCHANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>기간</Label>
              <RadioGroup
                value={selectedDateRange}
                onValueChange={setSelectedDateRange}
                className="flex gap-4"
              >
                {DATE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-zinc-950">
        <CardContent className="p-6">
          <div className="h-[500px]">
            {loading && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    데이터를 불러오는 중...
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-destructive">
                  <p className="font-medium">오류가 발생했습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            )}
            {!loading && !error && chartData.length > 0 && (
              <ExchangeReserveChart data={chartData} />
            )}
            {!loading && !error && chartData.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="font-medium">데이터가 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    다른 설정을 시도해보세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
