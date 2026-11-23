import type { SafeAuthor } from "./post";

export interface SafeComment {
  id: string;
  content: string;
  postId: string;
  author: SafeAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsPagination {
  page: number;
  limit: number;
  totalComments: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedCommentsResponse {
  comments: SafeComment[];
  pagination: CommentsPagination;
}
