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
  parentName?: string;
  parentId?: string;
  deviceId?: string;
  emergencyStatus?: EmergencyStatus;
  deviceBattery?: number;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}

export interface ParentDocument {
  id: string;
  uid?: string;
  name: string;
  parentName?: string;
  email?: string;
  phone: string;
  address: string;
  cnic: string;
  role?: 'parent' | 'student' | string;
  linkedStudentId?: string;
  studentId?: string;
  studentName?: string;
  children?: string[];
}

export interface DeviceDocument {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  assignedTo?: string;
}

export interface AlertDocument {
  id: string;
  studentId?: string;
  studentName: string;
  parentName?: string;
  type: AlertType;
  message?: string;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  status: AlertStatus;
}
