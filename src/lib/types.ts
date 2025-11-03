export type Hypeman = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type ClubEvent = {
  id: string;
  clubName: string;
  hypeman: Hypeman;
  imageUrl: string;
  isActive: boolean;
};

export type Hype = {
  id: string;
  senderName: string;
  message: string;
  amount: number;
  timestamp: string; // ISO 8601 format
  eventId: string;
  status: 'new' | 'hyped';
};

export type Tipper = {
    id: string;
    name: string;
    amount: number;
    avatarUrl: string;
};
