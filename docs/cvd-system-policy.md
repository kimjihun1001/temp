# Binance CVD 시스템 설계 문서

## 1. 시스템 구조

### 백엔드 (Node.js)

- WebSocket 연결 및 데이터 수집
- 실시간 데이터 가공 및 저장
- REST API 제공

### 프론트엔드 (Next.js)

- API를 통한 데이터 조회
- Recharts를 사용한 차트 표시
- 실시간 업데이트 (Polling)

### 데이터 저장소

- Redis: 실시간 데이터 캐싱
- RDB - PostgreSQL / MySQL

## 2. 데이터 흐름

### WebSocket → Redis

1. Binance WebSocket 연결 (`wss://stream.binance.com:9443/ws/btcusdt@trade`)
2. 거래 데이터 수신 및 가공
   ```javascript
   {
     price: number,
     quantity: number,
     isBuyerMaker: boolean,
     timestamp: number
   }
   ```
3. CVD 계산 및 구간 분류

   - 거래량 계산: `tradeVolume = price * quantity`
   - CVD 변화량: `cvdChange = isBuyerMaker ? -tradeVolume : tradeVolume`
   - 구간 분류: $100-1k, $1k-10k, $10k-100k, $100k+

4. Redis 저장 구조
   ```javascript
   // Hash 구조 사용
   key: "cvd:2025-10-25:14:00" // 시간별 키
   value: {
     totalCVD: 12345,
     cvd_100_1k: 100,
     cvd_1k_10k: 1000,
     cvd_10k_100k: 10000,
     cvd_100k_plus: 100000,
     timestamp: 1698213600000
   }
   ```

### Redis → RDB

- 주기: 1시간마다 배치 처리
- 데이터 압축: 시간대별 집계 데이터만 저장
- 보관 기간: 최근 3-6개월 (설정 가능)
- RDB별 테이블 구조:

  ```sql
  -- PostgreSQL
  CREATE TABLE cvd_data (
    time        TIMESTAMPTZ NOT NULL,
    total_cvd   DECIMAL,
    cvd_100_1k  DECIMAL,
    cvd_1k_10k  DECIMAL,
    cvd_10k_100k DECIMAL,
    cvd_100k_plus DECIMAL
  );

  -- MySQL
  CREATE TABLE cvd_data (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    time        TIMESTAMP NOT NULL,
    total_cvd   DECIMAL(20,8),
    cvd_100_1k  DECIMAL(20,8),
    cvd_1k_10k  DECIMAL(20,8),
    cvd_10k_100k DECIMAL(20,8),
    cvd_100k_plus DECIMAL(20,8),
    INDEX idx_time (time)
  ) PARTITION BY RANGE (UNIX_TIMESTAMP(time)) (
    PARTITION p_current VALUES LESS THAN (UNIX_TIMESTAMP(NOW())),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );
  ```

### API → 프론트엔드

1. 실시간 데이터 조회

   ```typescript
   GET /api/cvd/realtime
   Response: {
     timestamp: number;
     totalCVD: number;
     ranges: {
       "100-1k": number;
       "1k-10k": number;
       "10k-100k": number;
       "100k+": number;
     }
   }
   ```

2. 과거 데이터 조회
   ```typescript
   GET /api/cvd/historical?start={timestamp}&end={timestamp}
   Response: Array<CVDData>
   ```

## 3. 데이터 처리 정책

### 실시간 데이터

- Redis TTL: 24시간
- 집계 단위: 1분
- 최대 조회 범위: 60분

### 과거 데이터

- RDB 저장 (선택한 DB에 따라 최적화)
- 집계 단위: 1시간
- 파티셔닝: 월 단위
- 인덱스: 시간 기준

## 4. 에러 처리

### WebSocket

- 자동 재연결: Exponential backoff (1s → 2s → 4s)
- Ping/Pong: 3분마다 체크
- 연결 제한: 최대 1024 스트림, 초당 10 메시지

### Redis

- 연결 실패: RDB fallback
- 데이터 유실: 로깅 및 알림

### API

- Rate Limiting: 초당 요청 제한
- 타임아웃: 3초
- 에러 응답: 표준 HTTP 상태 코드

## 5. 모니터링

- WebSocket 연결 상태
- Redis 메모리 사용량
- RDB 연결 상태 및 성능
- API 응답 시간
- 데이터 처리 지연
- 디스크 사용량 (특히 로그 파일)

## 6. 보안

- API 키: 서버 환경변수로 관리
- Rate Limiting: IP 기반 제한
- 데이터 접근: 인증된 요청만 허용
