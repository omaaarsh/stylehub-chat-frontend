export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface UserProfile {
  id: string;
  type: 'USER';
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  profileImageUrl?: string;
  gender?: Gender;
  numberOfFollowers: number;
  numberOfFollowing: number;
  numberOfPosts: number;
  posts: Record<string, unknown>;
}

export interface BrandProfile {
  id: string;
  type: 'BRAND';
  brandName: string;
  username: string;
  websiteUrl?: string;
  bio?: string;
  profileImageUrl?: string;
  phoneNumber: string;
  numberOfFollowers: number;
  numberOfPosts: number;
}

export interface CompleteUserProfileRequest {
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  gender?: Gender;
}

export interface UpdateUserProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  gender?: Gender;
}

export interface CompleteBrandProfileRequest {
  brandName: string;
  username: string;
  phoneNumber: string;
  bio?: string;
  websiteUrl?: string;
}

export interface UpdateBrandProfileRequest {
  brandName?: string;
  username?: string;
  phoneNumber?: string;
  bio?: string;
  websiteUrl?: string;
}
