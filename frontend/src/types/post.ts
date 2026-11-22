export interface SafeAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface SafePost {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  author: SafeAuthor;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostPagination {
  page: number;
  limit: number;
  totalPosts: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedPostsResponse {
  posts: SafePost[];
  pagination: PostPagination;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
}
