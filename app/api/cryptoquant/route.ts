import { NextResponse } from "next/server";

const API_KEY = process.env.CRYPTOQUANT_API_KEY;

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "CRYPTOQUANT_API_KEY is not defined" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const exchange = searchParams.get("exchange") || "binance";
  const window = searchParams.get("window") || "day";
  const from = searchParams.get("from") || "20230101";
  const limit = searchParams.get("limit") || "100";

  try {
    // 거래소 보유량 데이터 가져오기
    const reserveResponse = await fetch(
      `https://api.cryptoquant.com/v1/btc/exchange-flows/reserve?exchange=${exchange}&window=${window}&from=${from}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        cache: "no-store",
      }
    );

    // 가격 데이터 가져오기
    const priceResponse = await fetch(
      `https://api.cryptoquant.com/v1/btc/market-data/price-ohlcv?window=${window}&from=${from}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!reserveResponse.ok || !priceResponse.ok) {
      const errorData = !reserveResponse.ok
        ? await reserveResponse.json()
        : await priceResponse.json();
      console.error(
        "CryptoQuant API 호출 중 오류 발생 (Next.js API):",
        errorData
      );
      return NextResponse.json(
        {
          error:
            errorData.status?.description ||
            "Failed to fetch data from CryptoQuant API",
        },
        { status: reserveResponse.status }
      );
    }

    const reserveData = await reserveResponse.json();
    const priceData = await priceResponse.json();

    // API 응답 로깅
    console.log("Reserve Data:", JSON.stringify(reserveData, null, 2));
    console.log("Price Data:", JSON.stringify(priceData, null, 2));

    // 두 데이터를 날짜를 기준으로 병합
    const mergedData = {
      status: reserveData.status,
      result: {
        window: reserveData.result.window,
        data: reserveData.result.data.map((reserveItem: any) => {
          const priceItem = priceData.result.data.find(
            (p: any) => p.date === reserveItem.date
          );
          return {
            date: reserveItem.date,
            reserve: reserveItem.reserve,
            price: priceItem?.close || null,
          };
        }),
      },
    };

    // 병합된 데이터 로깅
    console.log("Merged Data:", JSON.stringify(mergedData, null, 2));

    return NextResponse.json(mergedData);
  } catch (error: any) {
    console.error(
      "CryptoQuant API 호출 중 예외 발생 (Next.js API):",
      error.message
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
