import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const submitFailRate = new Rate('task_submit_fail_rate');
const rateLimitHits = new Counter('rate_limit_hits');
const duplicateBlocks = new Counter('duplicate_task_blocks');

export const options = {
  scenarios: {
    task_submit: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
    },
  },
  thresholds: {
    // We EXPECT some rate limiting - that's the point of this test
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  // Register and login test users
  const tokens = [];
  for (let i = 0; i < 10; i++) {
    const email = `tasktest-${i}@test.com`;
    http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email,
        password: 'password123',
        nickname: `TaskUser${i}`,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ account: email, password: 'password123' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (loginRes.status === 200) {
      try {
        tokens.push(JSON.parse(loginRes.body).data.accessToken);
      } catch {
        // skip
      }
    }
  }
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const destinations = ['北京', '上海', '成都', '杭州', '西安', '重庆', '广州', '深圳', '苏州', '南京'];
  const dest = destinations[Math.floor(Math.random() * destinations.length)];
  const days = Math.floor(Math.random() * 5) + 1;

  const payload = JSON.stringify({
    userInput: `${dest}${days}天自由行，预算中等`,
    preferences: {},
    travelConstraints: {},
    promptVersion: 'v1-pro',
  });

  const res = http.post(`${BASE_URL}/api/itinerary-tasks`, payload, { headers });

  if (res.status === 429) {
    rateLimitHits.add(1);
    check(res, {
      'rate limit returns 429': (r) => r.status === 429,
    });
  } else if (res.status === 409) {
    duplicateBlocks.add(1);
    check(res, {
      'duplicate blocked returns 409': (r) => r.status === 409,
    });
  } else {
    const passed = check(res, {
      'task submit status 200': (r) => r.status === 200,
      'has taskId': (r) => {
        try {
          return JSON.parse(r.body).data.taskId !== undefined;
        } catch {
          return false;
        }
      },
    });
    submitFailRate.add(!passed);
  }

  sleep(0.2);
}
