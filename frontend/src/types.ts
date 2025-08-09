export interface Lead {
  id: string;
  userId: string;
  name: string;
  email: string;
  company?: string;
  metadata?: any;
  createdAt: string;
}