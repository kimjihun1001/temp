import ChartControls from "./components/ChartControls";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">비트코인 거래소 보유량 분석</h1>
          <p className="text-muted-foreground mt-2">
            실시간 거래소 보유량과 가격 데이터를 확인하세요
          </p>
        </div>

        <ChartControls />
      </div>
    </div>
  );
}
