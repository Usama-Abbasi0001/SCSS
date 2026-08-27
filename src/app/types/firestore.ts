export type EmergencyStatus = 'active' | 'inactive';
export type AlertType = 'emergency' | 'warning' | 'info';
export type AlertStatus = 'active' | 'resolved';

export interface StudentDocument {
  id: string;
  uid?: string;
  studentId?: string;
  name: string;
  studentName?: string;
  email?: string;
  registrationNumber?: string;
  phone?: string;
  address?: string;
  class?: string;
  grade?: string;
  parentName?: string;
  parentId?: string;
  parentUid?: string;
  deviceId?: string;
  emergencyStatus?: EmergencyStatus;
  deviceBattery?: number;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  status?: string;
  createdAt?: string | any;
}

export interface ParentDocument {
  id: string;
  uid?: string;
  name: string;
  parentName?: string;
  email?: string;
  phone: string;
  contactNumber?: string;
  address: string;
  area?: string;
  cnic: string;
  role?: 'parent' | string;
  linkedStudentId?: string;
  studentId?: string;
  studentName?: string;
  children?: string[];
  createdAt?: string | any;
}

export interface DeviceDocument {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  assignedTo?: string;
  studentId?: string;
  battery?: number;
  lastSeen?: string | any;
}

export interface AlertDocument {
  id: string;
  studentId?: string;
  studentName: string;
  registrationNumber?: string;
  parentId?: string;
  parentName?: string;
  type: AlertType;
  message?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
  timestamp: string;
  status: AlertStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface LocationHistoryDocument {
  id: string;
  studentId: string;
  studentName?: string;
  registrationNumber?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  timestamp: string;
  createdAt?: string | any;
}

export interface LocationDocument {
  id: string;
  studentId: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  timestamp: string;
  updatedAt?: string | any;
}

export interface NotificationDocument {
  id: string;
  recipientId: string;
  studentId?: string;
  studentName?: string;
  registrationNumber?: string;
  type: 'sos' | 'emergency' | 'location' | 'resolved' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  googleMapsUrl?: string;
  createdAt?: string | any;
}

export interface UserStatusDocument {
  id?: string;
  uid?: string;
  isOnline: boolean;
  status: 'active' | 'inactive';
  lastActive: any;
  lastLogin?: any;
  role?: string;
}
