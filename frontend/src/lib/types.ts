export interface Department {
  id: number;
  name: string;
  slug: string;
  resource_count: number;
}

export interface Faculty {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  resource_count: number;
  departments: Department[];
}

export interface Resource {
  id: number;
  title: string;
  course_code: string;
  description: string;
  faculty_name: string;
  faculty_slug: string;
  department_name: string;
  department_slug: string;
  file_type: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  download_count: number;
  average_rating: number;
  rating_count: number;
  is_featured: boolean;
  uploaded_by_name: string;
  file_url?: string;
  updated_date?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'contributor';
  department_name: string | null;
}

export interface Invite {
  id: number;
  token: string;
  note: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  is_revoked: boolean;
  used_by: number | null;
  used_by_name: string | null;
  used_at: string | null;
}

export interface Contributor {
  id: number;
  username: string;
  full_name: string;
  email: string;
  department_name: string | null;
  date_joined: string;
  is_active_contributor: boolean;
  upload_count: number;
  downloads_earned: number;
  upvotes_earned: number;
}

export interface AdminStats {
  total_resources: number;
  total_downloads: number;
  total_ratings: number;
  total_contributors: number;
  active_invites: number;
  faculty_count: number;
  department_count: number;
  by_faculty: { name: string; resource_count: number }[];
  top_downloaded: { title: string; download_count: number }[];
}

export interface RecentDownload {
  id: number;
  title: string;
  timestamp: number;
}
