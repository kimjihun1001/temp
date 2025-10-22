# 비트코인 거래소 보유량 분석

실시간 거래소 보유량과 가격 데이터를 분석하는 대시보드입니다.

## 기능

- 거래소별 비트코인 보유량 조회
- 기간별 데이터 필터링 (1개월, 3개월, 6개월)
- 실시간 가격 데이터 연동
- 반응형 차트 UI

## 기술 스택

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 환경 변수

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```
CRYPTOQUANT_API_KEY=your_api_key_here
```

## API

- CryptoQuant API를 사용하여 거래소 보유량 데이터를 가져옵니다.
- 실시간 가격 데이터도 함께 표시됩니다.
