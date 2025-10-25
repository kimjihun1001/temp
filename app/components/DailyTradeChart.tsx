"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Trade {
  timestamp: number;
  price: number;
  quantity: number;
  isBuyerMaker: boolean;
}

interface CVDData {
  timestamp: number;
  totalCVD: number;
  cvd_100_1k: number;
  cvd_1k_10k: number;
  cvd_10k_100k: number;
  cvd_100k_plus: number;
  price: number;
  tradeCount: number;
}

interface CVDByRange {
  "100-1k": number;
  "1k-10k": number;
  "10k-100k": number;
  "100k+": number;
}

export default function DailyTradeChart() {
  const [cvdData, setCvdData] = useState<CVDData[]>([]);
  const [cvdByRange, setCvdByRange] = useState<CVDByRange>({
    "100-1k": 0,
    "1k-10k": 0,
    "10k-100k": 0,
    "100k+": 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCSV = async () => {
      try {
        console.log("일일 거래 데이터 로딩 시작...");
        const response = await fetch(
          "/data/BTCUSD_260327-trades-2025-10-24.csv"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log("CSV 파일 로드 완료. 첫 100자:", text.substring(0, 100));

        // CSV 파싱
        const rows = text.split("\n");
        console.log(`총 ${rows.length}개의 행 발견`);

        // 첫 번째 행은 헤더이므로 제외하고 파싱
        const trades: Trade[] = rows
          .slice(1)
          .filter((row) => row.trim()) // 빈 행 제거
          .map((row) => {
            try {
              const [, price, qty, , time, is_buyer_maker] = row.split(",");
              return {
                timestamp: parseInt(time),
                price: parseFloat(price),
                quantity: parseFloat(qty),
                isBuyerMaker: is_buyer_maker?.trim().toLowerCase() === "true",
              };
            } catch (error) {
              console.error("행 파싱 중 에러:", row, error);
              return null;
            }
          })
          .filter((trade): trade is Trade => trade !== null); // null 항목 제거

        console.log(`파싱된 거래 데이터 수: ${trades.length}`);
        if (trades.length > 0) {
          console.log("첫 번째 거래:", trades[0]);
        }

        // 5분 단위로 데이터 집계
        const fiveMinData = new Map<number, CVDData>();
        const totalCVDByRange: CVDByRange = {
          "100-1k": 0,
          "1k-10k": 0,
          "10k-100k": 0,
          "100k+": 0,
        };

        trades.forEach((trade) => {
          const fiveMinTimestamp =
            Math.floor(trade.timestamp / (300 * 1000)) * (300 * 1000);
          const tradeVolume = trade.price * trade.quantity; // 달러 기준 거래량
          const cvdChange = trade.isBuyerMaker ? -tradeVolume : tradeVolume;

          if (!fiveMinData.has(fiveMinTimestamp)) {
            fiveMinData.set(fiveMinTimestamp, {
              timestamp: fiveMinTimestamp,
              totalCVD: 0,
              cvd_100_1k: 0,
              cvd_1k_10k: 0,
              cvd_10k_100k: 0,
              cvd_100k_plus: 0,
              price: trade.price,
              tradeCount: 0,
            });
          }

          const timeData = fiveMinData.get(fiveMinTimestamp)!;
          timeData.totalCVD += cvdChange;
          timeData.price = trade.price;
          timeData.tradeCount += 1;

          // 달러 기준으로 구간 나누기
          if (tradeVolume >= 100 && tradeVolume < 1000) {
            timeData.cvd_100_1k += cvdChange;
            totalCVDByRange["100-1k"] += cvdChange;
          } else if (tradeVolume >= 1000 && tradeVolume < 10000) {
            timeData.cvd_1k_10k += cvdChange;
            totalCVDByRange["1k-10k"] += cvdChange;
          } else if (tradeVolume >= 10000 && tradeVolume < 100000) {
            timeData.cvd_10k_100k += cvdChange;
            totalCVDByRange["10k-100k"] += cvdChange;
          } else if (tradeVolume >= 100000) {
            timeData.cvd_100k_plus += cvdChange;
            totalCVDByRange["100k+"] += cvdChange;
          }
        });

        console.log(`5분 단위 데이터 포인트 수: ${fiveMinData.size}`);

        // 시간순으로 정렬
        const sortedData = Array.from(fiveMinData.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );

        // 누적 CVD 계산
        let runningTotal = 0;
        let running_100_1k = 0;
        let running_1k_10k = 0;
        let running_10k_100k = 0;
        let running_100k_plus = 0;

        const cumulativeData = sortedData.map((timeData) => {
          runningTotal += timeData.totalCVD;
          running_100_1k += timeData.cvd_100_1k;
          running_1k_10k += timeData.cvd_1k_10k;
          running_10k_100k += timeData.cvd_10k_100k;
          running_100k_plus += timeData.cvd_100k_plus;

          return {
            ...timeData,
            totalCVD: runningTotal,
            cvd_100_1k: running_100_1k,
            cvd_1k_10k: running_1k_10k,
            cvd_10k_100k: running_10k_100k,
            cvd_100k_plus: running_100k_plus,
          };
        });

        console.log(`최종 데이터 포인트 수: ${cumulativeData.length}`);
        if (cumulativeData.length > 0) {
          console.log("첫 번째 데이터 포인트:", cumulativeData[0]);
          console.log(
            "마지막 데이터 포인트:",
            cumulativeData[cumulativeData.length - 1]
          );
        }

        setCvdData(cumulativeData);
        setCvdByRange(totalCVDByRange);
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error("CSV 처리 중 에러:", error);
        setError(
          error instanceof Error
            ? error.message
            : "알 수 없는 에러가 발생했습니다"
        );
        setIsLoading(false);
      }
    };

    processCSV();
  }, []);

  // 날짜 포맷 함수
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ko-KR", {
      hour: "numeric",
      minute: "numeric",
    });
  };

  // 숫자 포맷 함수
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">데이터를 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-destructive">
            <p className="text-lg font-medium">에러가 발생했습니다</p>
            <p className="mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>10월 24일 비트코인 선물 가격</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cvdData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  type="number"
                  domain={["auto", "auto"]}
                />
                <YAxis
                  tickFormatter={(value) => `$${formatNumber(value)}`}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value: number) => `$${formatNumber(value)}`}
                  labelFormatter={formatTimestamp}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#E8B862"
                  name="가격"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10월 24일 누적 CVD (달러 기준)</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cvdData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  type="number"
                  domain={["auto", "auto"]}
                />
                <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} />
                <Tooltip
                  formatter={(value: number) => `$${formatNumber(value)}`}
                  labelFormatter={formatTimestamp}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalCVD"
                  stroke="#8884d8"
                  name="전체 CVD"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cvd_100_1k"
                  stroke="#82ca9d"
                  name="$100-1k"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cvd_1k_10k"
                  stroke="#ffc658"
                  name="$1k-10k"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cvd_10k_100k"
                  stroke="#ff7300"
                  name="$10k-100k"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cvd_100k_plus"
                  stroke="#ff0000"
                  name="$100k+"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10월 24일 구간별 순매수 금액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(cvdByRange).map(([range, value]) => (
              <div
                key={range}
                className="p-4 rounded-lg bg-card text-card-foreground"
              >
                <div className="text-sm text-muted-foreground">{range}</div>
                <div className="text-2xl font-bold">${formatNumber(value)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
