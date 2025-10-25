import ChartControls from "./components/ChartControls";
import BinanceCVDChart from "./components/BinanceCVDChart";
import HistoricalCVDChart from "./components/HistoricalCVDChart";
import DailyTradeChart from "./components/DailyTradeChart";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-12">
        <div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">비트코인 거래소 보유량 분석</h1>
            <p className="text-muted-foreground mt-2">
              실시간 거래소 보유량과 가격 데이터를 확인하세요
            </p>
          </div>
          <ChartControls />
        </div>

        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">실시간 Binance CVD 분석</h2>
            <p className="text-muted-foreground mt-2">
              BTC 수량 구간별 누적 거래량 델타를 실시간으로 확인하세요
            </p>
          </div>
          <BinanceCVDChart />
        </div>

        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">10월 24일 Binance CVD 분석</h2>
            <p className="text-muted-foreground mt-2">
              10월 24일의 BTC 수량 구간별 누적 거래량 델타를 확인하세요
            </p>
          </div>
          <DailyTradeChart />
        </div>

        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">9월 Binance CVD 분석</h2>
            <p className="text-muted-foreground mt-2">
              9월 한 달간의 금액 구간별 누적 거래량 델타를 확인하세요
            </p>
          </div>
          <HistoricalCVDChart />
        </div>
      </div>
    </div>
  );
}
