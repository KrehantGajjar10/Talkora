import 'dotenv/config';
import http from 'node:http';
import app from '../app.js';
import { prisma } from '../config/prisma.js';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../config/auth.js';

const PORT = 5066;
const BASE_URL = `http://localhost:${PORT}/api`;

interface ApiResponse<T = any> {
  status: number;
  data: any;
  headers: Headers;
}

function extractCookies(res: Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeader = res.headers.get('set-cookie');
  if (!setCookieHeader) return cookies;

  const parts = setCookieHeader.split(/,(?=[^;]+=[^;]+)/);
  for (const part of parts) {
    const match = part.trim().match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies[match[1].trim()] = match[2].trim();
    }
  }
  return cookies;
}

async function request(
  method: string,
  path: string,
  options: {
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<ApiResponse> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: Record<string, string> = { ...(options.headers || {}) };

  if (options.cookies) {
    const cookieHeader = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
  }

  let bodyStr: string | undefined;
  if (options.body !== undefined) {
    if (typeof options.body === 'string') {
      bodyStr = options.body;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } else {
      headers['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: bodyStr,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    status: res.status,
    data,
    headers: res.headers,
  };
}

let server: http.Server;

async function runRegressionSuite() {
  console.log(`=======================================================`);
  console.log(`Starting Talkora Chapter 11 Final Regression Suite`);
  console.log(`Server port: ${PORT}`);
  console.log(`=======================================================\n`);

  server = app.listen(PORT);

  const passedTests: string[] = [];
  const failedTests: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASSED] ${testName}`);
      passedTests.push(testName);
    } else {
      console.error(`[FAILED] ${testName} ${detail ? `- ${detail}` : ''}`);
      failedTests.push(`${testName} ${detail ? `- ${detail}` : ''}`);
    }
  }

  const testUsernames = ['c11_user_one', 'c11_user_two'];

  try {
    // 0. Cleanup any lingering test users from previous test runs
    await prisma.vote.deleteMany({
      where: { user: { username: { in: testUsernames } } },
    });
    await prisma.comment.deleteMany({
      where: { author: { username: { in: testUsernames } } },
    });
    await prisma.post.deleteMany({
      where: { author: { username: { in: testUsernames } } },
    });
    await prisma.session.deleteMany({
      where: { user: { username: { in: testUsernames } } },
    });
    await prisma.user.deleteMany({
      where: { username: { in: testUsernames } },
    });

    // ==========================================
    // 1. HEALTH & DOCUMENTATION
    // ==========================================
    const tHealth = await request('GET', '/health');
    assert(
      tHealth.status === 200 && tHealth.data.data.status === 'ok',
      '1. Health check returns 200 OK with status: ok'
    );

    const tDocsHtml = await request('GET', '/docs/');
    assert(
      tDocsHtml.status === 200 &&
        typeof tDocsHtml.data === 'string' &&
        (tDocsHtml.data.includes('swagger-ui') ||
          tDocsHtml.data.includes('Talkora API Documentation')),
      '2. Swagger UI explorer HTML loads at /api/docs/'
    );

    const tDocsJson = await request('GET', '/docs.json');
    assert(
      tDocsJson.status === 200 &&
        tDocsJson.data.openapi === '3.0.3' &&
        tDocsJson.data.info.title === 'Talkora API',
      '3. Raw OpenAPI 3.0 specification available at /api/docs.json'
    );

    // ==========================================
    // 2. ORIGIN & CSRF PROTECTION
    // ==========================================
    const tOriginAllowed = await request('POST', '/auth/login', {
      headers: { Origin: 'http://localhost:3000' },
      body: { identifier: 'nobody', password: 'wrong' },
    });
    assert(
      tOriginAllowed.status !== 403,
      '4. Valid frontend origin (http://localhost:3000) allowed'
    );

    const tOriginRejected = await request('POST', '/auth/login', {
      headers: { Origin: 'http://malicious-attacker.com' },
      body: { identifier: 'nobody', password: 'wrong' },
    });
    assert(
      tOriginRejected.status === 403,
      '5. Mismatched cross-origin request rejected with 403'
    );

    const tOriginNull = await request('POST', '/auth/login', {
      headers: { Origin: 'null' },
      body: { identifier: 'nobody', password: 'wrong' },
    });
    assert(
      tOriginNull.status === 403,
      '6. Untrusted Origin: null rejected with 403'
    );

    // ==========================================
    // 3. AUTHENTICATION & SESSION MANAGEMENT
    // ==========================================
    // Register User 1
    const tReg1 = await request('POST', '/auth/register', {
      body: {
        email: 'c11_user1@talkora.dev',
        username: 'c11_user_one',
        displayName: 'User One',
        password: 'Password123!',
      },
    });
    const user1Cookies = extractCookies(tReg1 as any);
    assert(
      tReg1.status === 201 &&
        Boolean(user1Cookies[ACCESS_COOKIE_NAME]) &&
        Boolean(user1Cookies[REFRESH_COOKIE_NAME]),
      '7. Registration creates user and issues HttpOnly access & refresh cookies'
    );

    // Duplicate registration rejected
    const tRegDuplicate = await request('POST', '/auth/register', {
      body: {
        email: 'c11_user1@talkora.dev',
        username: 'c11_user_one',
        displayName: 'User One Duplicate',
        password: 'Password123!',
      },
    });
    assert(
      tRegDuplicate.status === 409,
      '8. Duplicate email or username registration rejected with 409 Conflict'
    );

    // Register User 2
    const tReg2 = await request('POST', '/auth/register', {
      body: {
        email: 'c11_user2@talkora.dev',
        username: 'c11_user_two',
        displayName: 'User Two',
        password: 'Password123!',
      },
    });
    const user2Cookies = extractCookies(tReg2 as any);
    assert(tReg2.status === 201, '9. Second user registered successfully');

    // Login with valid credentials
    const tLogin = await request('POST', '/auth/login', {
      body: {
        identifier: 'c11_user_one',
        password: 'Password123!',
      },
    });
    const loggedInCookies = extractCookies(tLogin as any);
    assert(
      tLogin.status === 200 && Boolean(loggedInCookies[ACCESS_COOKIE_NAME]),
      '10. Login with valid credentials returns 200 OK and fresh session cookies'
    );

    // Login with invalid password
    const tLoginBad = await request('POST', '/auth/login', {
      body: {
        identifier: 'c11_user_one',
        password: 'WrongPassword!',
      },
    });
    assert(tLoginBad.status === 401, '11. Login with wrong password returns 401 Unauthorized');

    // Protected /auth/me with cookie
    const tMeAuth = await request('GET', '/auth/me', { cookies: loggedInCookies });
    assert(
      tMeAuth.status === 200 && tMeAuth.data.data.user.username === 'c11_user_one',
      '12. Protected GET /auth/me returns authenticated user'
    );

    // Protected /auth/me without cookie
    const tMeGuest = await request('GET', '/auth/me');
    assert(tMeGuest.status === 401, '13. Protected GET /auth/me without cookie returns 401');

    // Refresh token rotation
    const tRefresh = await request('POST', '/auth/refresh', { cookies: loggedInCookies });
    const refreshedCookies = extractCookies(tRefresh as any);
    assert(
      tRefresh.status === 200 &&
        Boolean(refreshedCookies[ACCESS_COOKIE_NAME]) &&
        Boolean(refreshedCookies[REFRESH_COOKIE_NAME]),
      '14. POST /auth/refresh rotates access and refresh cookies'
    );

    // Replay of old refresh token rejected
    const tReplay = await request('POST', '/auth/refresh', { cookies: loggedInCookies });
    assert(
      tReplay.status === 401,
      '15. Replay of previously rotated refresh token rejected with 401'
    );

    // ==========================================
    // 4. LOGOUT & STALE REFRESH COOKIE FALLBACK (Issue B)
    // ==========================================
    // Log in afresh to get synchronized cookies
    const tFreshLogin = await request('POST', '/auth/login', {
      body: { identifier: 'c11_user_one', password: 'Password123!' },
    });
    const activeCookies = extractCookies(tFreshLogin as any);

    // Stale refresh cookie fallback: Provide an invalid/tampered refresh token alongside the valid access token
    const cookiesWithStaleRefresh = {
      [ACCESS_COOKIE_NAME]: activeCookies[ACCESS_COOKIE_NAME],
      [REFRESH_COOKIE_NAME]: 'tampered_or_stale_refresh_token_12345',
    };

    const tLogoutFallback = await request('POST', '/auth/logout', {
      cookies: cookiesWithStaleRefresh,
    });
    assert(
      tLogoutFallback.status === 200,
      '16. Logout with stale refresh cookie and valid access cookie succeeds (200 OK)'
    );

    // Verify session was revoked despite the stale refresh cookie: /auth/me should now return 401
    const tMeAfterLogout = await request('GET', '/auth/me', {
      cookies: { [ACCESS_COOKIE_NAME]: activeCookies[ACCESS_COOKIE_NAME] },
    });
    assert(
      tMeAfterLogout.status === 401,
      '17. Access session confirmed revoked via logout fallback despite stale refresh cookie'
    );

    // Repeated logout is safe and idempotent
    const tRepeatedLogout = await request('POST', '/auth/logout');
    assert(
      tRepeatedLogout.status === 200,
      '18. Repeated logout is safe and idempotent'
    );

    // Re-login User 1 and User 2 for downstream tests
    const u1Login = await request('POST', '/auth/login', {
      body: { identifier: 'c11_user_one', password: 'Password123!' },
    });
    const u1Cookies = extractCookies(u1Login as any);

    const u2Login = await request('POST', '/auth/login', {
      body: { identifier: 'c11_user_two', password: 'Password123!' },
    });
    const u2Cookies = extractCookies(u2Login as any);

    // ==========================================
    // 5. USER PROFILES
    // ==========================================
    const tUserProf = await request('GET', '/users/c11_user_one');
    assert(
      tUserProf.status === 200 && tUserProf.data.data.profile.username === 'c11_user_one',
      '19. Public user profile retrieved successfully'
    );

    const tUserNotFound = await request('GET', '/users/nobody_exists_here');
    assert(tUserNotFound.status === 404, '20. Nonexistent user returns 404');

    const tUpdateProf = await request('PATCH', '/users/me', {
      cookies: u1Cookies,
      body: { displayName: 'User One Hardened' },
    });
    assert(
      tUpdateProf.status === 200 &&
        tUpdateProf.data.data.profile.displayName === 'User One Hardened',
      '21. Profile update by authenticated user returns 200 OK'
    );

    const tUpdateProfGuest = await request('PATCH', '/users/me', {
      body: { displayName: 'Hacker' },
    });
    assert(tUpdateProfGuest.status === 401, '22. Profile update without authentication returns 401');

    // ==========================================
    // 6. POSTS & VALIDATION
    // ==========================================
    const tCreatePost = await request('POST', '/posts', {
      cookies: u1Cookies,
      body: {
        title: 'Chapter 11 Hardened Post',
        content: 'Testing production hardening and validation rules.',
      },
    });
    assert(tCreatePost.status === 201, '23. Authenticated user creates post (201 Created)');
    const postId = tCreatePost.data.data.post.id;

    // Empty title validation
    const tBadPost = await request('POST', '/posts', {
      cookies: u1Cookies,
      body: { title: '' },
    });
    assert(tBadPost.status === 422, '24. Post with empty title rejected with 422 Validation Error');

    // Get post by ID
    const tGetPost = await request('GET', `/posts/${postId}`);
    assert(tGetPost.status === 200, '25. Get post by ID returns 200 OK');

    // Edit post text (author)
    const tEditPost = await request('PATCH', `/posts/${postId}`, {
      cookies: u1Cookies,
      body: { title: 'Chapter 11 Hardened Post (Edited)' },
    });
    assert(tEditPost.status === 200, '26. Author edits post title (200 OK)');

    // Edit post text (non-author)
    const tEditForbidden = await request('PATCH', `/posts/${postId}`, {
      cookies: u2Cookies,
      body: { title: 'Unauthorized Edit' },
    });
    assert(tEditForbidden.status === 403, '27. Non-author edit rejected with 403 Forbidden');

    // ==========================================
    // 7. COMMENTS
    // ==========================================
    const tCreateComment = await request('POST', `/posts/${postId}/comments`, {
      cookies: u2Cookies,
      body: { content: 'Great architecture discussion!' },
    });
    assert(tCreateComment.status === 201, '28. Create comment on post returns 201 Created');
    const commentId = tCreateComment.data.data.comment.id;

    const tListComments = await request('GET', `/posts/${postId}/comments`);
    assert(
      tListComments.status === 200 && tListComments.data.data.comments.length >= 1,
      '29. List comments returns 200 OK with pagination'
    );

    const tEditCommentForbidden = await request('PATCH', `/comments/${commentId}`, {
      cookies: u1Cookies,
      body: { content: 'Tampered comment' },
    });
    assert(tEditCommentForbidden.status === 403, '30. Non-author editing comment rejected with 403');

    const tEditCommentAuthor = await request('PATCH', `/comments/${commentId}`, {
      cookies: u2Cookies,
      body: { content: 'Great architecture discussion! (Clarified)' },
    });
    assert(tEditCommentAuthor.status === 200, '31. Comment author edits comment (200 OK)');

    // ==========================================
    // 8. POST VOTING
    // ==========================================
    const tUpvote = await request('POST', `/posts/${postId}/vote`, {
      cookies: u2Cookies,
      body: { type: 'UPVOTE' },
    });
    assert(
      tUpvote.status === 200 &&
        tUpvote.data.data.upvotes === 1 &&
        tUpvote.data.data.score === 1 &&
        tUpvote.data.data.userVote === 'UPVOTE',
      '32. Upvote records vote atomically with score: 1'
    );

    const tChangeVote = await request('POST', `/posts/${postId}/vote`, {
      cookies: u2Cookies,
      body: { type: 'DOWNVOTE' },
    });
    assert(
      tChangeVote.status === 200 &&
        tChangeVote.data.data.downvotes === 1 &&
        tChangeVote.data.data.score === -1 &&
        tChangeVote.data.data.userVote === 'DOWNVOTE',
      '33. Changing vote updates score to -1 atomically'
    );

    const tGuestVote = await request('POST', `/posts/${postId}/vote`, {
      body: { type: 'UPVOTE' },
    });
    assert(tGuestVote.status === 401, '34. Guest attempt to vote rejected with 401');

    const tDeleteVote = await request('DELETE', `/posts/${postId}/vote`, {
      cookies: u2Cookies,
    });
    assert(
      tDeleteVote.status === 200 &&
        tDeleteVote.data.data.score === 0 &&
        tDeleteVote.data.data.userVote === null,
      '35. User removes vote and score returns to 0'
    );

    // ==========================================
    // 9. FEED SORTING & RANKING
    // ==========================================
    const tFeedNewest = await request('GET', '/posts?sort=newest&limit=5');
    assert(tFeedNewest.status === 200, '36. GET /posts?sort=newest returns 200 OK');

    const tFeedTop = await request('GET', '/posts?sort=top&limit=5');
    assert(tFeedTop.status === 200, '37. GET /posts?sort=top returns 200 OK');

    const tFeedDownvoted = await request('GET', '/posts?sort=downvoted&limit=5');
    assert(tFeedDownvoted.status === 200, '38. GET /posts?sort=downvoted returns 200 OK');

    const tFeedBadSort = await request('GET', '/posts?sort=unknown_sort_type');
    assert(tFeedBadSort.status === 422, '39. Unsupported sort option rejected with 422');

    // ==========================================
    // 10. ERROR HANDLING & RESILIENCE
    // ==========================================
    const t404 = await request('GET', '/nonexistent-endpoint-route');
    assert(
      t404.status === 404 && t404.data.message === 'Route not found',
      '40. Centralized error handling returns 404 for nonexistent routes'
    );

    const tMalformedJson = await request('POST', '/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json string without closing quote',
    });
    assert(
      tMalformedJson.status === 400,
      '41. Malformed JSON request body safely handled with 400 Bad Request'
    );

    // Clean up post (delete cascades comments and votes)
    const tDeletePost = await request('DELETE', `/posts/${postId}`, {
      cookies: u1Cookies,
    });
    assert(tDeletePost.status === 204, '42. Author deletes post (204 No Content)');

    // Clean up test data
    await prisma.vote.deleteMany({
      where: { user: { username: { in: testUsernames } } },
    });
    await prisma.comment.deleteMany({
      where: { author: { username: { in: testUsernames } } },
    });
    await prisma.post.deleteMany({
      where: { author: { username: { in: testUsernames } } },
    });
    await prisma.session.deleteMany({
      where: { user: { username: { in: testUsernames } } },
    });
    await prisma.user.deleteMany({
      where: { username: { in: testUsernames } },
    });

    console.log(`\n=======================================================`);
    console.log(`FINAL REGRESSION TEST RESULTS`);
    console.log(`Total tests: ${passedTests.length + failedTests.length}`);
    console.log(`Passed: ${passedTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    console.log(`=======================================================`);

    if (failedTests.length > 0) {
      console.error('\nFailures detected:');
      for (const f of failedTests) {
        console.error(` - ${f}`);
      }
      process.exitCode = 1;
    } else {
      console.log('\n✅ ALL 42 FINAL REGRESSION TESTS PASSED CLEANLY!\n');
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runRegressionSuite();
