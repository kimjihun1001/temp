"use client";

import { useEffect, useRef, useState } from "react";
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
  price: number;
  quantity: number;
  timestamp: number;
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

export default function BinanceCVDChart() {
  const tradeWs = useRef<WebSocket | null>(null);
  const priceWs = useRef<WebSocket | null>(null);
  const [cvdData, setCvdData] = useState<CVDData[]>([]);
  const [priceData, setPriceData] = useState<
    { timestamp: number; price: number }[]
  >([]);
  const [cvdByRange, setCvdByRange] = useState<CVDByRange>({
    "100-1k": 0,
    "1k-10k": 0,
    "10k-100k": 0,
    "100k+": 0,
  });
  const [lastTradeData, setLastTradeData] = useState<string>("");
  const [lastPriceData, setLastPriceData] = useState<string>("");
  const [tradeCount, setTradeCount] = useState<number>(0);

  useEffect(() => {
    // 거래 데이터 웹소켓 연결
    const connectTradeWebSocket = () => {
      const socket = new WebSocket(
        "wss://fstream.binancefuture.com/ws/btcusdt@trade"
      );

      socket.onopen = () => {
        console.log("거래 웹소켓 연결됨");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLastTradeData(JSON.stringify(data, null, 2));

        const trade = {
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          timestamp: data.T,
          isBuyerMaker: data.m,
        };

        setTradeCount((prev) => prev + 1);

        // 달러 기준 CVD 계산
        const tradeVolume = trade.price * trade.quantity;
        const cvdChange = trade.isBuyerMaker ? -tradeVolume : tradeVolume;

        // CVD 데이터 업데이트 (1분 단위)
        setCvdData((prev) => {
          const currentMinute =
            Math.floor(trade.timestamp / (60 * 1000)) * (60 * 1000);
          const lastData = prev[prev.length - 1];

          if (lastData && lastData.timestamp === currentMinute) {
            // 같은 분에 대한 데이터 업데이트
            const updatedData = [...prev];
            const lastIndex = updatedData.length - 1;

            updatedData[lastIndex] = {
              ...lastData,
              totalCVD: lastData.totalCVD + cvdChange,
              price: trade.price,
              tradeCount: lastData.tradeCount + 1,
            };

            // 달러 기준으로 구간 업데이트
            if (tradeVolume >= 100 && tradeVolume < 1000) {
              updatedData[lastIndex].cvd_100_1k += cvdChange;
            } else if (tradeVolume >= 1000 && tradeVolume < 10000) {
              updatedData[lastIndex].cvd_1k_10k += cvdChange;
            } else if (tradeVolume >= 10000 && tradeVolume < 100000) {
              updatedData[lastIndex].cvd_10k_100k += cvdChange;
            } else if (tradeVolume >= 100000) {
              updatedData[lastIndex].cvd_100k_plus += cvdChange;
            }

            return updatedData;
          } else {
            // 새로운 분의 데이터 추가
            const newData = {
              timestamp: currentMinute,
              totalCVD: (lastData?.totalCVD || 0) + cvdChange,
              cvd_100_1k: lastData?.cvd_100_1k || 0,
              cvd_1k_10k: lastData?.cvd_1k_10k || 0,
              cvd_10k_100k: lastData?.cvd_10k_100k || 0,
              cvd_100k_plus: lastData?.cvd_100k_plus || 0,
              price: trade.price,
              tradeCount: 1,
            };

            // 달러 기준으로 구간 업데이트
            if (tradeVolume >= 100 && tradeVolume < 1000) {
              newData.cvd_100_1k += cvdChange;
            } else if (tradeVolume >= 1000 && tradeVolume < 10000) {
              newData.cvd_1k_10k += cvdChange;
            } else if (tradeVolume >= 10000 && tradeVolume < 100000) {
              newData.cvd_10k_100k += cvdChange;
            } else if (tradeVolume >= 100000) {
              newData.cvd_100k_plus += cvdChange;
            }

            const newDataArray = [...prev, newData];
            return newDataArray.slice(-60); // 최근 60분 데이터만 유지
          }
        });

        // 구간별 총합 업데이트
        setCvdByRange((prev) => {
          const newCVD = { ...prev };
          if (tradeVolume >= 100 && tradeVolume < 1000) {
            newCVD["100-1k"] += cvdChange;
          } else if (tradeVolume >= 1000 && tradeVolume < 10000) {
            newCVD["1k-10k"] += cvdChange;
          } else if (tradeVolume >= 10000 && tradeVolume < 100000) {
            newCVD["10k-100k"] += cvdChange;
          } else if (tradeVolume >= 100000) {
            newCVD["100k+"] += cvdChange;
          }
          return newCVD;
        });
      };

      socket.onclose = () => {
        console.log("거래 웹소켓 연결 종료");
        setTimeout(connectTradeWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error("거래 웹소켓 에러:", error);
      };

      tradeWs.current = socket;
    };

    // 가격 데이터 웹소켓 연결
    const connectPriceWebSocket = () => {
      const socket = new WebSocket(
        "wss://fstream.binancefuture.com/ws/btcusdt@markPrice"
      );

      socket.onopen = () => {
        console.log("가격 웹소켓 연결됨");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLastPriceData(JSON.stringify(data, null, 2));

        setPriceData((prev) => {
          const newData = [
            ...prev,
            {
              timestamp: data.E,
              price: parseFloat(data.p),
            },
          ];
          return newData.slice(-60); // 최근 60개 데이터만 유지
        });
      };

      socket.onclose = () => {
        console.log("가격 웹소켓 연결 종료");
        setTimeout(connectPriceWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error("가격 웹소켓 에러:", error);
      };

      priceWs.current = socket;
    };

    connectTradeWebSocket();
    connectPriceWebSocket();

    return () => {
      if (tradeWs.current) tradeWs.current.close();
      if (priceWs.current) priceWs.current.close();
    };
  }, []);

  // 날짜 포맷 함수
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ko-KR", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  };

  // 숫자 포맷 함수
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>비트코인 선물 가격</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
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
          <CardTitle>실시간 CVD (달러 기준)</CardTitle>
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
          <CardTitle>구간별 순매수 금액</CardTitle>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>최근 거래 데이터 (Raw)</CardTitle>
            <div className="text-sm text-muted-foreground">
              총 거래 수: {tradeCount}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-sm">
              {lastTradeData}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 가격 데이터 (Raw)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-sm">
              {lastPriceData}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
