import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const feedFailRate = new Rate('feed_fail_rate');
const feedDuration = new Trend('feed_duration_ms');
const interactionFailRate = new Rate('interaction_fail_rate');

export const options = {
  scenarios: {
    feed_browse: {
      executor: 'constant-vus',
      vus: 500,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    feed_fail_rate: ['rate<0.05'],
    interaction_fail_rate: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  // Register and login a batch of users, collect tokens
  const tokens = [];
  for (let i = 0; i < 50; i++) {
    const email = `feedtest-${i}@test.com`;
    http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email,
        password: 'password123',
        nickname: `FeedUser${i}`,
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

  // 1. Browse feed (80% of requests)
  if (Math.random() < 0.8) {
    const feedRes = http.get(`${BASE_URL}/api/feed`, { headers });
    feedDuration.add(feedRes.timings.duration);
    const feedPassed = check(feedRes, {
      'feed status 200': (r) => r.status === 200,
      'feed response < 300ms': (r) => r.timings.duration < 300,
    });
    feedFailRate.add(!feedPassed);
  } else {
    // 2. Like or favorite a random post (20% of requests)
    const feedRes = http.get(`${BASE_URL}/api/feed`, { headers });
    if (feedRes.status === 200) {
      try {
        const posts = JSON.parse(feedRes.body).data;
        if (posts && posts.length > 0) {
          const post = posts[Math.floor(Math.random() * posts.length)];
          const action = Math.random() < 0.5 ? 'like' : 'favorite';
          const interactionRes = http.post(
            `${BASE_URL}/api/posts/${post.postId}/${action}`,
            null,
            { headers },
          );
          const interactionPassed = check(interactionRes, {
            [`${action} status 200`]: (r) => r.status === 200,
          });
          interactionFailRate.add(!interactionPassed);
        }
      } catch {
        interactionFailRate.add(true);
      }
    }
  }

  sleep(0.05);
}
