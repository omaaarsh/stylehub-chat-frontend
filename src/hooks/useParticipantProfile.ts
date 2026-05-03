import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import type { UserProfile, BrandProfile } from '../types/profile.types';

export interface ParticipantInfo {
  displayName: string;
  avatarUrl: string | null;
  initials: string;
}

function toParticipantInfo(profile: UserProfile | BrandProfile): ParticipantInfo {
  if (profile.type === 'USER') {
    const full = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    const displayName = full || profile.username;
    const initials = full
      ? full
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join('')
      : profile.username.slice(0, 2).toUpperCase();
    return { displayName, avatarUrl: profile.profileImageUrl ?? null, initials };
  }

  // BRAND
  const displayName = profile.brandName || profile.username;
  const initials = displayName.slice(0, 2).toUpperCase();
  return { displayName, avatarUrl: profile.profileImageUrl ?? null, initials };
}

export function useParticipantProfile(userId: string) {
  return useQuery<ParticipantInfo>({
    queryKey: ['participant', userId],
    queryFn: () => userApi.getPublicProfile(userId).then(toParticipantInfo),
    staleTime: 5 * 60 * 1000, // profiles rarely change — cache for 5 minutes
    retry: 1,
  });
}
