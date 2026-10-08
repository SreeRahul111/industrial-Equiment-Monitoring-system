export type UserRole = 'ADMIN' | 'ENGINEER' | 'VIEWER';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type MachineStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface Sensor {
  id: number;
  machine_id: number;
  sensor_type: string;
  sensor_code: string;
  unit: string;
  status: string;
  created_at: string;
}

export interface Telemetry {
  id: number;
  machine_id: number;
  sensor_id?: number;
  temperature: number;
  pressure: number;
  vibration: number;
  power_consumption: number;
  operating_status: string;
  timestamp: string;
  validation_status: string;
}

export interface Threshold {
  id: number;
  machine_id: number;
  temperature_min: number;
  temperature_max: number;
  pressure_min: number;
  pressure_max: number;
  vibration_max: number;
  power_min: number;
  power_max: number;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ThresholdHistory {
  id: number;
  threshold_id: number;
  machine_id: number;
  version: number;
  temperature_min: number;
  temperature_max: number;
  pressure_min: number;
  pressure_max: number;
  vibration_max: number;
  power_min: number;
  power_max: number;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: number;
  machine_id: number;
  machine_code?: string;
  machine_name?: string;
  alert_code?: string;
  alert_type: string;
  severity: AlertSeverity;
  measured_value: number;
  threshold_value: number;
  status: AlertStatus;
  message: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Maintenance {
  id: number;
  machine_id: number;
  machine_code?: string;
  machine_name?: string;
  scheduled_date: string;
  maintenance_type: string;
  assigned_engineer: string;
  status: MaintenanceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: number;
  actor_user_id?: number;
  actor_name?: string;
  actor_role?: string;
  action: string;
  target_type: string;
  target_id?: string;
  result: string;
  metadata_json?: string;
  timestamp: string;
}

export interface Machine {
  id: number;
  machine_code: string;
  name: string;
  location: string;
  status: MachineStatus;
  created_at: string;
  updated_at: string;
  latest_telemetry?: Telemetry;
  active_alerts_count?: number;
}

export interface MachineDetail extends Machine {
  sensors: Sensor[];
  threshold?: Threshold;
  recent_telemetry: Telemetry[];
  active_alerts: Alert[];
}

export interface ServiceHealthStatus {
  status: string;
  latency_ms?: number;
  message?: string;
}

export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  timestamp: string;
  services: Record<string, ServiceHealthStatus>;
}

export interface MetricsResponse {
  total_machines: number;
  normal_machines: number;
  warning_machines: number;
  critical_machines: number;
  active_alerts: number;
  telemetry_ingestion_rate_per_min: number;
  audit_events_24h: number;
  auth_failures_24h: number;
  denied_actions_24h: number;
  latest_telemetry_timestamp?: string;
}
