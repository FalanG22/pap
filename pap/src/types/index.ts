export type Tenant = {
  id: string;
  name: string;
  slug: string;
  config?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

export type TenantUser = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'super_admin' | 'lab_admin' | 'viewer';
};

export type Patient = {
  id: string;
  tenant_id: string;
  dni: string;
  full_name: string;
  birth_date: string | null;
  sex: 'male' | 'female' | 'other' | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered';

export type Order = {
  id: string;
  tenant_id: string;
  patient_id: string;
  status: OrderStatus;
  pdf_token: string;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
};

export type SampleQuality = 'adequate' | 'inadequate';

export type Diagnosis = {
  id: string;
  tenant_id: string;
  order_id: string;
  specialist_id: string;
  sample_quality: SampleQuality;
  general_category: string;
  descriptive_dx: string;
  macros_used: string[];
  is_signed: boolean;
  signed_at: string | null;
  digital_signature: string | null;
  created_at: string;
  updated_at: string;
};

export type MacroTemplate = {
  id: string;
  tenant_id: string;
  shortcode: string;
  full_text: string;
  category: string | null;
  created_at: string;
};

export type NotificationType = 'email' | 'sms' | 'whatsapp';
export type NotificationRecipient = 'lab' | 'patient';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export type Notification = {
  id: string;
  tenant_id: string;
  order_id: string;
  type: NotificationType;
  recipient_role: NotificationRecipient;
  recipient: string;
  status: NotificationStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  tenant_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};
