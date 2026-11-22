import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Talkora API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for Talkora, a full-stack community discussion platform featuring cookie-based JWT sessions, user profiles, posts with image uploads, threaded discussions (comments), upvoting/downvoting, and PostgreSQL-level ranking.',
    contact: {
      name: 'Talkora Development Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Primary API server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'talkora_access',
        description: 'HttpOnly access token cookie issued on login/refresh.',
      },
      refreshCookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'talkora_refresh',
        description: 'HttpOnly refresh token cookie used for session rotation and logout.',
      },
    },
    schemas: {
      FieldError: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'content' },
          message: { type: 'string', example: 'Comment content cannot be empty' },
        },
        required: ['message'],
      },
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
        required: ['success', 'message', 'data'],
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: { $ref: '#/components/schemas/FieldError' },
          },
        },
        required: ['success', 'message', 'errors'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalPosts: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPreviousPage: { type: 'boolean', example: false },
        },
        required: ['page', 'limit', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
      },
      SafeAuthor: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cm7user123' },
          username: { type: 'string', example: 'alex' },
          displayName: { type: 'string', example: 'Alex Developer' },
          avatarUrl: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg' },
        },
        required: ['id', 'username', 'displayName', 'avatarUrl'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cm7user123' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          username: { type: 'string', example: 'alex' },
          displayName: { type: 'string', example: 'Alex Developer' },
          avatarUrl: { type: 'string', nullable: true, example: null },
          bio: { type: 'string', nullable: true, example: 'Full-stack software engineer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'email', 'username', 'displayName', 'createdAt', 'updatedAt'],
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cm7post123' },
          title: { type: 'string', example: 'Architecture of Talkora' },
          content: { type: 'string', nullable: true, example: 'A deep dive into our backend architecture.' },
          imageUrl: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
          author: { $ref: '#/components/schemas/SafeAuthor' },
          commentCount: { type: 'integer', example: 8 },
          upvotes: { type: 'integer', example: 15 },
          downvotes: { type: 'integer', example: 2 },
          score: { type: 'integer', example: 13 },
          userVote: { type: 'string', enum: ['UPVOTE', 'DOWNVOTE', null], nullable: true, example: 'UPVOTE' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'title', 'author', 'commentCount', 'upvotes', 'downvotes', 'score', 'createdAt', 'updatedAt'],
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cm7comment123' },
          content: { type: 'string', example: 'Excellent architectural insights!' },
          postId: { type: 'string', example: 'cm7post123' },
          author: { $ref: '#/components/schemas/SafeAuthor' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'content', 'postId', 'author', 'createdAt', 'updatedAt'],
      },
      VoteData: {
        type: 'object',
        properties: {
          upvotes: { type: 'integer', example: 12 },
          downvotes: { type: 'integer', example: 3 },
          score: { type: 'integer', example: 9 },
          userVote: { type: 'string', enum: ['UPVOTE', 'DOWNVOTE', null], nullable: true, example: 'UPVOTE' },
        },
        required: ['upvotes', 'downvotes', 'score', 'userVote'],
      },
      RegisterInput: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'newuser@example.com' },
          username: { type: 'string', minLength: 3, maxLength: 30, example: 'newuser' },
          password: { type: 'string', minLength: 8, example: 'SecurePassword123!' },
          displayName: { type: 'string', minLength: 1, maxLength: 50, example: 'New User' },
        },
        required: ['email', 'username', 'password', 'displayName'],
      },
      LoginInput: {
        type: 'object',
        properties: {
          identifier: { type: 'string', example: 'newuser' },
          password: { type: 'string', example: 'SecurePassword123!' },
        },
        required: ['identifier', 'password'],
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30, example: 'alex_updated' },
          displayName: { type: 'string', minLength: 1, maxLength: 50, example: 'Updated Name' },
          bio: { type: 'string', maxLength: 500, nullable: true, example: 'My updated bio' },
        },
        additionalProperties: false,
      },
      CreatePostInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 300, example: 'Discussion Title' },
          content: { type: 'string', maxLength: 20000, example: 'Discussion text content' },
        },
        required: ['title'],
      },
      EditPostTextInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 300, example: 'Updated Title' },
          content: { type: 'string', maxLength: 20000, example: 'Updated text content' },
        },
      },
      CreateCommentInput: {
        type: 'object',
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 5000, example: 'A thoughtful comment' },
        },
        required: ['content'],
      },
      VoteInput: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['UPVOTE', 'DOWNVOTE'], example: 'UPVOTE' },
        },
        required: ['type'],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Service Health Check',
        description: 'Returns health status of the backend server and its database connection.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Backend service is healthy.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 124.5 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Service Readiness Check',
        description: 'Returns readiness status of the backend by executing an active query against PostgreSQL.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Backend service and database are ready.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Talkora API is ready' },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ready' },
                        database: { type: 'string', example: 'connected' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          503: {
            description: 'Database is unavailable or not ready.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new account',
        description: 'Creates a new user profile and establishes an authenticated session with HttpOnly cookies.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully. Cookies set: talkora_access, talkora_refresh.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          409: {
            description: 'Email or username already in use.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          422: {
            description: 'Validation error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with credentials',
        description: 'Authenticates a user by email or username, and sets HttpOnly session cookies.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful. Cookies set: talkora_access, talkora_refresh.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          429: {
            description: 'Too many login attempts. Rate limit exceeded.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate session tokens',
        description: 'Uses the HttpOnly refresh token to issue a new access token and rotate the refresh token.',
        tags: ['Authentication'],
        security: [{ refreshCookieAuth: [] }],
        responses: {
          200: {
            description: 'Session rotated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Refresh token missing, invalid, expired, or replay detected.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Log out current session',
        description: 'Revokes the active session and clears the HttpOnly authentication cookies idempotently.',
        tags: ['Authentication'],
        responses: {
          200: {
            description: 'Logged out successfully. Cookies cleared.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user',
        description: 'Returns private user profile details of the currently authenticated session.',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Current user profile.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Authentication required.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/{username}': {
      get: {
        summary: 'Get public user profile',
        description: 'Returns the public profile and recent posts for the specified username.',
        tags: ['Users'],
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Username of the user',
          },
        ],
        responses: {
          200: {
            description: 'User profile retrieved successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          404: {
            description: 'User not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/{username}/posts': {
      get: {
        summary: 'Get user posts feed',
        description: 'Returns a paginated list of posts authored by the specified user, sorted newest first.',
        tags: ['Users'],
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Username of the author',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, maximum: 50 },
            description: 'Number of posts per page (max 50)',
          },
        ],
        responses: {
          200: {
            description: 'User posts retrieved successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User posts retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        posts: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Post' },
                        },
                        pagination: { $ref: '#/components/schemas/PaginationMeta' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me': {
      patch: {
        summary: 'Update own user profile',
        description: 'Updates username, display name, or bio for the authenticated user.',
        tags: ['Users'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Authentication required.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          422: {
            description: 'Validation failed.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/posts': {
      get: {
        summary: 'Get public post feed',
        description: 'Returns paginated posts with PostgreSQL-level sorting. Supports optional authentication to include userVote.',
        tags: ['Posts'],
        parameters: [
          {
            name: 'sort',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['newest', 'top', 'downvoted'], default: 'newest' },
            description: 'Sorting mode: newest (createdAt DESC), top (score DESC), downvoted (score ASC)',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
            description: 'Items per page (max 50)',
          },
        ],
        responses: {
          200: {
            description: 'Feed retrieved successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Feed retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        posts: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Post' },
                        },
                        pagination: { $ref: '#/components/schemas/PaginationMeta' },
                      },
                    },
                  },
                },
              },
            },
          },
          422: {
            description: 'Invalid sort or pagination parameters.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new post',
        description: 'Creates a post with text and optional image upload (max 5 MB, JPEG/PNG/WebP).',
        tags: ['Posts'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Post Title' },
                  content: { type: 'string', example: 'Optional text content' },
                  image: { type: 'string', format: 'binary' },
                },
                required: ['title'],
              },
            },
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePostInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Post created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Authentication required.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          413: {
            description: 'Uploaded image exceeds 5 MB size limit.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          415: {
            description: 'Unsupported image format or signature mismatch.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          422: {
            description: 'Validation failed.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/posts/{postId}': {
      get: {
        summary: 'Get post details',
        description: 'Retrieves complete post details, vote counts, net score, and userVote.',
        tags: ['Posts'],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID of the post',
          },
        ],
        responses: {
          200: {
            description: 'Post retrieved successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          404: {
            description: 'Post not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        summary: 'Edit post text',
        description: 'Edits the title and/or content of an existing post. Author only.',
        tags: ['Posts'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EditPostTextInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Post updated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          403: {
            description: 'Forbidden: You can only edit your own posts.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          404: {
            description: 'Post not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete post',
        description: 'Deletes post and cascade-deletes associated comments, votes, and Cloudinary image. Author only.',
        tags: ['Posts'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          204: {
            description: 'Post deleted successfully. No content.',
          },
          403: {
            description: 'Forbidden: You can only delete your own posts.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          404: {
            description: 'Post not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/posts/{postId}/image': {
      patch: {
        summary: 'Replace or remove post image',
        description: 'Uploads a replacement image (multipart/form-data) or removes existing image ({ remove: true }). Author only.',
        tags: ['Posts'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  remove: { type: 'boolean', example: true },
                },
                required: ['remove'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Post image updated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          403: {
            description: 'Forbidden: You can only modify your own posts.',
          },
          413: {
            description: 'Image too large (max 5 MB).',
          },
          415: {
            description: 'Unsupported media format.',
          },
        },
      },
    },
    '/posts/{postId}/comments': {
      get: {
        summary: 'List comments for a post',
        description: 'Returns paginated comments ordered newest first (createdAt DESC). Public endpoint.',
        tags: ['Comments'],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 50 },
          },
        ],
        responses: {
          200: {
            description: 'Comments retrieved successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          404: {
            description: 'Post not found.',
          },
        },
      },
      post: {
        summary: 'Create a comment on a post',
        description: 'Adds a flat comment (1-5000 characters) to the post. Authenticated users only.',
        tags: ['Comments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCommentInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Comment created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Authentication required.',
          },
          404: {
            description: 'Post not found.',
          },
          422: {
            description: 'Validation failed (empty, oversized, or invalid content).',
          },
        },
      },
    },
    '/comments/{commentId}': {
      patch: {
        summary: 'Edit comment content',
        description: 'Updates comment text (1-5000 characters). Author only.',
        tags: ['Comments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'commentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCommentInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Comment updated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          403: {
            description: 'Forbidden: You can only edit your own comments.',
          },
          404: {
            description: 'Comment not found.',
          },
        },
      },
      delete: {
        summary: 'Delete comment',
        description: 'Deletes a comment. Author only.',
        tags: ['Comments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'commentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          204: {
            description: 'Comment deleted successfully. No content.',
          },
          403: {
            description: 'Forbidden: You can only delete your own comments.',
          },
          404: {
            description: 'Comment not found.',
          },
        },
      },
    },
    '/posts/{postId}/vote': {
      get: {
        summary: 'Get vote statistics for a post',
        description: 'Returns upvotes, downvotes, net score, and the requesting user’s vote. Public endpoint.',
        tags: ['Votes'],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Vote data retrieved successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          404: {
            description: 'Post not found.',
          },
        },
      },
      post: {
        summary: 'Cast or change vote on a post',
        description: 'Atomically upvotes or downvotes a post. Safe against race conditions via compound unique constraint.',
        tags: ['Votes'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VoteInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Vote recorded successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Authentication required.',
          },
          404: {
            description: 'Post not found.',
          },
          422: {
            description: 'Validation failed (must be UPVOTE or DOWNVOTE).',
          },
        },
      },
      delete: {
        summary: 'Remove vote from a post',
        description: 'Idempotently removes the authenticated user’s vote from the specified post.',
        tags: ['Votes'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Vote removed successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Authentication required.',
          },
          404: {
            description: 'Post not found.',
          },
        },
      },
    },
  },
};

const router = Router();

// Raw OpenAPI JSON specification
router.get('/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openApiSpec);
});

// Swagger UI Explorer
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Talkora API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

export default router;
