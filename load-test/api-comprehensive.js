import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const apiFailRate = new Rate('api_fail_rate');
const apiDuration = new Trend('api_duration_ms');
const requestsTotal = new Counter('requests_total');
const errorsTotal = new Counter('errors_total');

export const options = {
  scenarios: {
    mixed_workload: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 300 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 50 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(90)<400', 'p(95)<600', 'p(99)<1000'],
    api_fail_rate: ['rate<0.03'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36',
];

export function setup() {
  const tokens = [];
  for (let i = 0; i < 100; i++) {
    const email = `comptest-${i}@test.com`;
    http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email,
        password: 'password123',
        nickname: `CompUser${i}`,
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
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
  };

  const action = Math.random();
  
  if (action < 0.35) {
    testFeedBrowse(headers);
  } else if (action < 0.55) {
    testUserProfile(headers);
  } else if (action < 0.75) {
    testPostInteraction(headers);
  } else if (action < 0.90) {
    testItineraryTask(headers);
  } else {
    testSocialActions(headers);
  }

  sleep(Math.random() * 0.5 + 0.1);
}

function testFeedBrowse(headers) {
  const page = Math.floor(Math.random() * 10);
  const res = http.get(`${BASE_URL}/api/feed?page=${page}&size=20`, { headers });
  requestsTotal.add(1);
  apiDuration.add(res.timings.duration);
  
  const passed = check(res, {
    'feed status 200': (r) => r.status === 200,
    'feed response valid': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.code === 200 && Array.isArray(json.data);
      } catch {
        return false;
      }
    },
  });
  
  if (!passed) errorsTotal.add(1);
  apiFailRate.add(!passed);
}

function testUserProfile(headers) {
  const res = http.get(`${BASE_URL}/api/users/profile`, { headers });
  requestsTotal.add(1);
  apiDuration.add(res.timings.duration);
  
  const passed = check(res, {
    'profile status 200': (r) => r.status === 200,
    'profile has userId': (r) => {
      try {
        return JSON.parse(r.body).data.userId !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  if (!passed) errorsTotal.add(1);
  apiFailRate.add(!passed);
}

function testPostInteraction(headers) {
  const feedRes = http.get(`${BASE_URL}/api/feed?page=0&size=10`, { headers });
  if (feedRes.status === 200) {
    try {
      const posts = JSON.parse(feedRes.body).data;
      if (posts && posts.length > 0) {
        const post = posts[Math.floor(Math.random() * posts.length)];
        const action = Math.random() < 0.6 ? 'like' : 'favorite';
        
        const res = http.post(
          `${BASE_URL}/api/posts/${post.postId}/${action}`,
          null,
          { headers },
        );
        requestsTotal.add(1);
        apiDuration.add(res.timings.duration);
        
        const passed = check(res, {
          [`${action} status 200`]: (r) => r.status === 200,
        });
        
        if (!passed) errorsTotal.add(1);
        apiFailRate.add(!passed);
      }
    } catch {
      errorsTotal.add(1);
      apiFailRate.add(true);
    }
  } else {
    errorsTotal.add(1);
    apiFailRate.add(true);
  }
}

function testItineraryTask(headers) {
  const destinations = ['北京', '上海', '成都', '杭州', '西安'];
  const dest = destinations[Math.floor(Math.random() * destinations.length)];
  const days = Math.floor(Math.random() * 5) + 1;

  const payload = JSON.stringify({
    originCity: '北京',
    destinationCity: dest,
    travelDate: '2024-08-15',
    durationDays: days,
    budgetLevel: 'MEDIUM',
    interests: ['food', 'sightseeing'],
  });

  const res = http.post(`${BASE_URL}/api/itinerary/tasks`, payload, { headers });
  requestsTotal.add(1);
  apiDuration.add(res.timings.duration);
  
  const passed = check(res, {
    'task submit status 200 or 202': (r) => r.status === 200 || r.status === 202,
  });
  
  if (!passed) errorsTotal.add(1);
  apiFailRate.add(!passed);
}

function testSocialActions(headers) {
  const action = Math.random();
  
  if (action < 0.4) {
    const res = http.post(
      `${BASE_URL}/api/social/follow/user-002`,
      null,
      { headers },
    );
    requestsTotal.add(1);
    apiDuration.add(res.timings.duration);
    
    const passed = check(res, {
      'follow status 200 or 409': (r) => r.status === 200 || r.status === 409,
    });
    
    if (!passed) errorsTotal.add(1);
    apiFailRate.add(!passed);
  } else {
    const payload = JSON.stringify({
      content: 'Great itinerary! ' + Math.random().toString(36).substr(2, 9),
    });
    
    const res = http.post(
      `${BASE_URL}/api/posts/post-001/comments`,
      payload,
      { headers },
    );
    requestsTotal.add(1);
    apiDuration.add(res.timings.duration);
    
    const passed = check(res, {
      'comment status 200': (r) => r.status === 200,
    });
    
    if (!passed) errorsTotal.add(1);
    apiFailRate.add(!passed);
  }
}