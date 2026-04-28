import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const loginFailRate = new Rate('login_fail_rate');
const loginDuration = new Trend('login_duration_ms');

export const options = {
  scenarios: {
    login_stress: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    login_fail_rate: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Pre-register users before stress test
export function setup() {
  const users = [];
  for (let i = 0; i < 200; i++) {
    const email = `loadtest-${i}@test.com`;
    const res = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email: email,
        password: 'password123',
        nickname: `LoadUser${i}`,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (res.status === 200) {
      users.push({ email, password: 'password123' });
    } else if (res.status === 409) {
      // Already exists from previous run
      users.push({ email, password: 'password123' });
    }
  }
  return { users };
}

export default function (data) {
  const user = data.users[__VU % data.users.length];
  const payload = JSON.stringify({
    account: user.email,
    password: user.password,
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  loginDuration.add(res.timings.duration);
  const passed = check(res, {
    'login status 200': (r) => r.status === 200,
    'has accessToken': (r) => {
      try {
        return JSON.parse(r.body).data.accessToken !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  loginFailRate.add(!passed);
  sleep(0.1);
}
