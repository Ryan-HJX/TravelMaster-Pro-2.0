import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const healthFailRate = new Rate('health_fail_rate');
const healthDuration = new Trend('health_duration_ms');

export const options = {
  scenarios: {
    health_check: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<100'],
    health_fail_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  
  healthDuration.add(res.timings.duration);
  
  const passed = check(res, {
    'health status 200': (r) => r.status === 200,
    'health response valid': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.status === 'UP';
      } catch {
        return false;
      }
    },
    'health response < 100ms': (r) => r.timings.duration < 100,
  });
  
  healthFailRate.add(!passed);
  sleep(1);
}