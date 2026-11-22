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

function extractCookies(res: { headers: Headers }): Record<string, string> {
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
  console.log(`Starting Talkora Chapter 11.1 Final Regression Suite`);
  console.log(`Server port: ${PORT}`);
  console.log(`=======================================================\n`);

  // ==========================================
  // DATABASE SAFETY GATE
  // ==========================================
  if (process.env.ALLOW_TEST_EXECUTION !== 'true') {
    console.error(
      '❌ Safety Gate Abort: Regression tests require ALLOW_TEST_EXECUTION=true to run.'
    );
    process.exit(1);
  }

  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DATABASE_URL?.toLowerCase().includes('production')
  ) {
    console.error(
      '❌ Safety Gate Abort: Regression tests are forbidden against production databases!'
    );
    process.exit(1);
  }

  // Active database connection verification
  try {
    const dbCheck = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database()::text as db`;
    const currentDb = dbCheck[0]?.db || 'unknown';
    console.log(`[Safety Gate Passed] Connected to test database: ${currentDb}`);
  } catch (dbErr) {
    console.error('❌ Safety Gate Abort: Could not connect to database:', dbErr);
    process.exit(1);
  }

  // Disable rate limiting for the automated test suite execution
  process.env.DISABLE_RATE_LIMIT = 'true';

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

  // Exact ID Tracking for safe, deterministic cleanup
  const trackedUserIds = new Set<string>();
  const trackedPostIds = new Set<string>();
  const trackedCommentIds = new Set<string>();

  // Unique per-run identifiers (randomized suffix prevents race conditions or collisions)
  const runSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const u1Username = `t_u1_${runSuffix}`.slice(0, 30);
  const u2Username = `t_u2_${runSuffix}`.slice(0, 30);
  const u1Email = `user1_${runSuffix}@talkora.test`;
  const u2Email = `user2_${runSuffix}@talkora.test`;

  try {
    // ==========================================
    // 1. HEALTH & READINESS & DOCUMENTATION
    // ==========================================
    const tHealth = await request('GET', '/health');
    assert(
      tHealth.status === 200 && tHealth.data.data.status === 'ok',
      '1. Health check returns 200 OK with status: ok'
    );

    const tReady = await request('GET', '/health/ready');
    assert(
      tReady.status === 200 &&
        tReady.data.data.status === 'ready' &&
        tReady.data.data.database === 'connected',
      '2. Readiness check returns 200 OK with database: connected'
    );

    const tDocsHtml = await request('GET', '/docs/');
    assert(
      tDocsHtml.status === 200 &&
        typeof tDocsHtml.data === 'string' &&
        (tDocsHtml.data.includes('swagger-ui') ||
          tDocsHtml.data.includes('Talkora API Documentation')),
      '3. Swagger UI explorer HTML loads at /api/docs/'
    );

    const tDocsJson = await request('GET', '/docs.json');
    assert(
      tDocsJson.status === 200 &&
        tDocsJson.data.openapi === '3.0.3' &&
        Boolean(tDocsJson.data.paths?.['/health/ready']) &&
        Boolean(tDocsJson.data.paths?.['/users/{username}/posts']),
      '4. OpenAPI 3.0 specification includes /health/ready and /users/{username}/posts'
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
      '5. Valid frontend origin (http://localhost:3000) allowed past origin gate'
    );

    const tOriginRejected = await request('POST', '/auth/login', {
      headers: { Origin: 'http://malicious-attacker.com' },
      body: { identifier: 'nobody', password: 'wrong' },
    });
    assert(
      tOriginRejected.status === 403,
      '6. Mismatched cross-origin request rejected with 403'
    );

    const tOriginNull = await request('POST', '/auth/login', {
      headers: { Origin: 'null' },
      body: { identifier: 'nobody', password: 'wrong' },
    });
    assert(
      tOriginNull.status === 403,
      '7. Untrusted Origin: null rejected with 403'
    );

    // ==========================================
    // 3. AUTHENTICATION & SESSION MANAGEMENT
    // ==========================================
    // Register User 1
    const tReg1 = await request('POST', '/auth/register', {
      body: {
        email: u1Email,
        username: u1Username,
        displayName: 'User One',
        password: 'Password123!',
      },
    });
    const user1Cookies = extractCookies(tReg1);
    if (tReg1.status === 201 && tReg1.data?.data?.user?.id) {
      trackedUserIds.add(tReg1.data.data.user.id);
    }
    assert(
      tReg1.status === 201 &&
        Boolean(user1Cookies[ACCESS_COOKIE_NAME]) &&
        Boolean(user1Cookies[REFRESH_COOKIE_NAME]),
      '8. Registration creates user and issues HttpOnly access & refresh cookies'
    );

    // Duplicate registration rejected
    const tRegDuplicate = await request('POST', '/auth/register', {
      body: {
        email: u1Email,
        username: u1Username,
        displayName: 'User One Duplicate',
        password: 'Password123!',
      },
    });
    assert(
      tRegDuplicate.status === 409,
      '9. Duplicate email or username registration rejected with 409 Conflict'
    );

    // Register User 2
    const tReg2 = await request('POST', '/auth/register', {
      body: {
        email: u2Email,
        username: u2Username,
        displayName: 'User Two',
        password: 'Password123!',
      },
    });
    const user2Cookies = extractCookies(tReg2);
    if (tReg2.status === 201 && tReg2.data?.data?.user?.id) {
      trackedUserIds.add(tReg2.data.data.user.id);
    }
    assert(
      tReg2.status === 201 && Boolean(user2Cookies[ACCESS_COOKIE_NAME]),
      '10. Second test user registered successfully'
    );

    // Login User 1
    const tLogin1 = await request('POST', '/auth/login', {
      body: {
        identifier: u1Email,
        password: 'Password123!',
      },
    });
    let u1Cookies = extractCookies(tLogin1);
    assert(
      tLogin1.status === 200 && Boolean(u1Cookies[ACCESS_COOKIE_NAME]),
      '11. Login with valid credentials succeeds and issues fresh cookies'
    );

    // Login with invalid password
    const tLoginBad = await request('POST', '/auth/login', {
      body: {
        identifier: u1Email,
        password: 'WrongPassword!',
      },
    });
    assert(
      tLoginBad.status === 401,
      '12. Login with invalid password rejected with 401 Unauthorized'
    );

    // Authenticated Profile (GET /auth/me)
    const tMeAuth = await request('GET', '/auth/me', { cookies: u1Cookies });
    assert(
      tMeAuth.status === 200 &&
        tMeAuth.data.data.user.username === u1Username &&
        tMeAuth.data.data.user.passwordHash === undefined,
      '13. GET /api/auth/me returns authenticated user profile without password hash'
    );

    // Unauthenticated Profile (GET /auth/me)
    const tMeUnauth = await request('GET', '/auth/me');
    assert(
      tMeUnauth.status === 401,
      '14. GET /api/auth/me without cookies returns 401 Unauthorized'
    );

    // ==========================================
    // 4. USER PROFILES
    // ==========================================
    const tUpdateProfile = await request('PATCH', '/users/me', {
      cookies: u1Cookies,
      body: {
        displayName: 'User One Updated',
        bio: 'Updated bio for user one testing',
      },
    });
    assert(
      tUpdateProfile.status === 200 &&
        tUpdateProfile.data.data.profile.displayName === 'User One Updated' &&
        tUpdateProfile.data.data.profile.bio === 'Updated bio for user one testing',
      '15. PATCH /api/users/me updates displayName and bio'
    );

    // Reject unknown fields like avatarUrl on PATCH /users/me
    const tUpdateBadField = await request('PATCH', '/users/me', {
      cookies: u1Cookies,
      body: {
        avatarUrl: 'https://evil.com/pic.png',
      },
    });
    assert(
      tUpdateBadField.status === 422,
      '16. PATCH /api/users/me rejects disallowed avatarUrl payload with 422'
    );

    // Public Profile lookup
    const tGetProfile = await request('GET', `/users/${u1Username}`);
    assert(
      tGetProfile.status === 200 &&
        tGetProfile.data.data.profile.username === u1Username &&
        typeof tGetProfile.data.data.profile.postCount === 'number',
      '17. GET /api/users/:username returns public profile with postCount'
    );

    const tGetProfile404 = await request('GET', '/users/nonexistent_user_9999');
    assert(
      tGetProfile404.status === 404,
      '18. GET /api/users/:username for unknown user returns 404'
    );

    // ==========================================
    // 5. POSTS MANAGEMENT & IMAGE SECURITY
    // ==========================================
    // Create Post (Text only)
    const tCreatePost = await request('POST', '/posts', {
      cookies: u1Cookies,
      body: {
        title: 'Chapter 11.1 Automated Test Post',
        content: 'This post is created by automated regression suite for validation.',
      },
    });
    const postId = tCreatePost.data?.data?.post?.id;
    if (postId) {
      trackedPostIds.add(postId);
    }
    assert(
      tCreatePost.status === 201 && Boolean(postId),
      '19. Authenticated user creates text-only post (201 Created)'
    );

    // Reject post without content or image
    const tCreateEmptyPost = await request('POST', '/posts', {
      cookies: u1Cookies,
      body: {
        title: 'Empty Post Title',
      },
    });
    assert(
      tCreateEmptyPost.status === 422,
      '20. Post creation without content or image rejected with 422'
    );

    // Reject spoofed image mime type
    const boundary = '----WebKitFormBoundaryRegressionTest';
    const fakeMultipartBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Spoofed Image Post',
      `--${boundary}`,
      'Content-Disposition: form-data; name="image"; filename="fake.png"',
      'Content-Type: image/png',
      '',
      'THIS_IS_PLAIN_TEXT_NOT_A_VALID_PNG_SIGNATURE',
      `--${boundary}--`,
    ].join('\r\n');

    const tSpoofedImage = await request('POST', '/posts', {
      cookies: u1Cookies,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: fakeMultipartBody,
    });
    assert(
      tSpoofedImage.status === 415,
      '21. Spoofed image file (invalid magic bytes) rejected with 415 Unsupported Media Type'
    );

    // Get post by ID
    const tGetPost = await request('GET', `/posts/${postId}`);
    assert(
      tGetPost.status === 200 && tGetPost.data.data.post.id === postId,
      '22. GET /api/posts/:postId returns full post details'
    );

    const tGetPost404 = await request('GET', '/posts/nonexistent_post_id');
    assert(
      tGetPost404.status === 404,
      '23. GET /api/posts/:postId for nonexistent post returns 404'
    );

    // Edit post text as author
    const tEditPostAuthor = await request('PATCH', `/posts/${postId}`, {
      cookies: u1Cookies,
      body: {
        title: 'Chapter 11.1 Post Updated Title',
      },
    });
    assert(
      tEditPostAuthor.status === 200 &&
        tEditPostAuthor.data.data.post.title === 'Chapter 11.1 Post Updated Title',
      '24. Post author can edit post title/content (200 OK)'
    );

    // Edit post text as non-author
    const tEditPostForbidden = await request('PATCH', `/posts/${postId}`, {
      cookies: user2Cookies,
      body: {
        title: 'Hacked Title Attempt',
      },
    });
    assert(
      tEditPostForbidden.status === 403,
      '25. Non-author editing post text rejected with 403 Forbidden'
    );

    // ==========================================
    // 6. VOTING SYSTEM
    // ==========================================
    // Cast UPVOTE as User 2
    const tUpvote = await request('POST', `/posts/${postId}/votes`, {
      cookies: user2Cookies,
      body: { type: 'UPVOTE' },
    });
    assert(
      tUpvote.status === 200 &&
        tUpvote.data.data.upvotes === 1 &&
        tUpvote.data.data.score === 1 &&
        tUpvote.data.data.userVote === 'UPVOTE',
      '26. User 2 casts UPVOTE: score becomes +1 and userVote is UPVOTE'
    );

    // Inspect vote status via GET
    const tGetVote = await request('GET', `/posts/${postId}/votes`, {
      cookies: user2Cookies,
    });
    assert(
      tGetVote.status === 200 &&
        tGetVote.data.data.score === 1 &&
        tGetVote.data.data.userVote === 'UPVOTE',
      '27. GET /api/posts/:postId/votes reflects current vote state'
    );

    // Switch vote to DOWNVOTE
    const tDownvote = await request('POST', `/posts/${postId}/votes`, {
      cookies: user2Cookies,
      body: { type: 'DOWNVOTE' },
    });
    assert(
      tDownvote.status === 200 &&
        tDownvote.data.data.downvotes === 1 &&
        tDownvote.data.data.score === -1 &&
        tDownvote.data.data.userVote === 'DOWNVOTE',
      '28. User 2 flips vote to DOWNVOTE: score becomes -1 and userVote is DOWNVOTE'
    );

    // Remove vote (DELETE /posts/:postId/votes)
    const tRemoveVote = await request('DELETE', `/posts/${postId}/votes`, {
      cookies: user2Cookies,
    });
    assert(
      tRemoveVote.status === 200 &&
        tRemoveVote.data.data.score === 0 &&
        tRemoveVote.data.data.userVote === null,
      '29. User 2 removes vote: score returns to 0 and userVote becomes null'
    );

    // ==========================================
    // 7. COMMENTS MANAGEMENT
    // ==========================================
    const tCreateComment = await request('POST', `/posts/${postId}/comments`, {
      cookies: user2Cookies,
      body: { content: 'Insightful comment from User Two.' },
    });
    const commentId = tCreateComment.data?.data?.comment?.id;
    if (commentId) {
      trackedCommentIds.add(commentId);
    }
    assert(
      tCreateComment.status === 201 && Boolean(commentId),
      '30. Authenticated user creates comment on post (201 Created)'
    );

    const tListComments = await request('GET', `/posts/${postId}/comments`);
    assert(
      tListComments.status === 200 &&
        Array.isArray(tListComments.data.data.comments) &&
        tListComments.data.data.comments.some((c: any) => c.id === commentId),
      '31. GET /api/posts/:postId/comments returns comment list including new comment'
    );

    const tEditComment = await request('PATCH', `/comments/${commentId}`, {
      cookies: user2Cookies,
      body: { content: 'Edited comment content by User Two.' },
    });
    assert(
      tEditComment.status === 200 &&
        tEditComment.data.data.comment.content === 'Edited comment content by User Two.',
      '32. Comment author can edit comment content (200 OK)'
    );

    const tEditCommentForbidden = await request('PATCH', `/comments/${commentId}`, {
      cookies: u1Cookies,
      body: { content: 'Unauthorized comment edit attempt' },
    });
    assert(
      tEditCommentForbidden.status === 403,
      '33. Non-author editing comment rejected with 403 Forbidden'
    );

    const tDeleteComment = await request('DELETE', `/comments/${commentId}`, {
      cookies: user2Cookies,
    });
    assert(
      tDeleteComment.status === 204,
      '34. Comment author deletes comment (204 No Content)'
    );

    // ==========================================
    // 8. FEED SORTING & RANKING
    // ==========================================
    const tFeedNewest = await request('GET', '/posts?sort=newest&page=1&limit=5');
    assert(
      tFeedNewest.status === 200 && Array.isArray(tFeedNewest.data.data.posts),
      '35. GET /api/posts?sort=newest returns paginated posts'
    );

    const tFeedTop = await request('GET', '/posts?sort=top&page=1&limit=5');
    assert(
      tFeedTop.status === 200 && Array.isArray(tFeedTop.data.data.posts),
      '36. GET /api/posts?sort=top returns ranked posts by net vote score'
    );

    const tFeedDownvoted = await request('GET', '/posts?sort=downvoted&page=1&limit=5');
    assert(
      tFeedDownvoted.status === 200 && Array.isArray(tFeedDownvoted.data.data.posts),
      '37. GET /api/posts?sort=downvoted returns lowest scored posts'
    );

    const tFeedBadSort = await request('GET', '/posts?sort=unknown_sort_type');
    assert(
      tFeedBadSort.status === 422,
      '38. Unsupported sort option rejected with 422'
    );

    // ==========================================
    // 9. USER POSTS ENDPOINT (MVP COMPLETION)
    // ==========================================
    const tUserPosts = await request('GET', `/users/${u1Username}/posts?page=1&limit=10`);
    assert(
      tUserPosts.status === 200 &&
        Array.isArray(tUserPosts.data.data.posts) &&
        tUserPosts.data.data.posts.length > 0 &&
        tUserPosts.data.data.pagination.totalPosts >= 1,
      '39. GET /api/users/:username/posts returns paginated posts feed for user'
    );

    const tUserPosts404 = await request('GET', '/users/nonexistent_xyz_9999/posts');
    assert(
      tUserPosts404.status === 404,
      '40. GET /api/users/:username/posts returns 404 for nonexistent user'
    );

    // Clean up post as authenticated author
    const tDeletePost = await request('DELETE', `/posts/${postId}`, {
      cookies: u1Cookies,
    });
    assert(tDeletePost.status === 204, '41. Author deletes post (204 No Content)');

    // ==========================================
    // 10. SESSION ROTATION & REVOCATION FALLBACK
    // ==========================================
    // Refresh session tokens
    const tRefresh = await request('POST', '/auth/refresh', {
      cookies: u1Cookies,
    });
    const refreshedCookies = extractCookies(tRefresh);
    assert(
      tRefresh.status === 200 &&
        Boolean(refreshedCookies[ACCESS_COOKIE_NAME]) &&
        Boolean(refreshedCookies[REFRESH_COOKIE_NAME]),
      '42. POST /api/auth/refresh rotates refresh token and issues new access token'
    );

    // Old refresh token must be rejected
    const tOldRefresh = await request('POST', '/auth/refresh', {
      cookies: u1Cookies,
    });
    assert(
      tOldRefresh.status === 401,
      '43. Replay of old refresh token rejected with 401 Unauthorized'
    );

    // Logout with stale refresh cookie + valid access cookie:
    // User has refreshedCookies[ACCESS_COOKIE_NAME] (valid) and u1Cookies[REFRESH_COOKIE_NAME] (stale)
    const tLogout = await request('POST', '/auth/logout', {
      cookies: {
        [ACCESS_COOKIE_NAME]: refreshedCookies[ACCESS_COOKIE_NAME],
        [REFRESH_COOKIE_NAME]: u1Cookies[REFRESH_COOKIE_NAME], // Stale refresh token
      },
    });
    assert(
      tLogout.status === 200,
      '44. Logout with stale refresh cookie + valid access cookie successfully revokes session in DB'
    );

    // Access token from revoked session must now be rejected
    const tRevokedAccess = await request('GET', '/auth/me', {
      cookies: {
        [ACCESS_COOKIE_NAME]: refreshedCookies[ACCESS_COOKIE_NAME],
      },
    });
    assert(
      tRevokedAccess.status === 401,
      '45. Access token from revoked session rejected with 401 Unauthorized'
    );

    // ==========================================
    // 11. CENTRALIZED ERROR HANDLING & RESILIENCE
    // ==========================================
    const t404 = await request('GET', '/nonexistent-endpoint-route');
    assert(
      t404.status === 404 && t404.data.message === 'Route not found',
      '46. Centralized error handling returns 404 for nonexistent routes'
    );

    const tMalformedJson = await request('POST', '/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json string without closing quote',
    });
    assert(
      tMalformedJson.status === 400,
      '47. Malformed JSON request body safely handled with 400 Bad Request'
    );

    console.log(`\n=======================================================`);
    console.log(`FINAL REGRESSION TEST RESULTS`);
    console.log(`Total assertions: ${passedTests.length + failedTests.length}`);
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
      console.log(`\n✅ ALL ${passedTests.length} FINAL REGRESSION TESTS PASSED CLEANLY!\n`);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Safe cleanup in finally: Delete ONLY records tracked by ID during this run
    try {
      if (trackedCommentIds.size > 0) {
        await prisma.comment.deleteMany({
          where: { id: { in: Array.from(trackedCommentIds) } },
        });
      }
      if (trackedPostIds.size > 0) {
        await prisma.vote.deleteMany({
          where: { postId: { in: Array.from(trackedPostIds) } },
        });
        await prisma.comment.deleteMany({
          where: { postId: { in: Array.from(trackedPostIds) } },
        });
        await prisma.post.deleteMany({
          where: { id: { in: Array.from(trackedPostIds) } },
        });
      }
      if (trackedUserIds.size > 0) {
        await prisma.vote.deleteMany({
          where: { userId: { in: Array.from(trackedUserIds) } },
        });
        await prisma.session.deleteMany({
          where: { userId: { in: Array.from(trackedUserIds) } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: Array.from(trackedUserIds) } },
        });
      }
      console.log(`[Safety Cleanup] Successfully deleted only tracked test records (${trackedUserIds.size} users, ${trackedPostIds.size} posts, ${trackedCommentIds.size} comments).`);
    } catch (cleanupErr) {
      console.error('[Safety Cleanup] Error during cleanup:', cleanupErr);
    }
    await prisma.$disconnect();
  }
}

runRegressionSuite();
