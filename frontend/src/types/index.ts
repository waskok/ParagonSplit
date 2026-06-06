export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

export type GroupMember = {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: AuthUser;
};

export type GroupSummary = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  owner: AuthUser;
  members: GroupMember[];
  myRole?: "OWNER" | "MEMBER";
  _count?: { receipts: number; members: number };
};

export type GroupDetail = GroupSummary & {
  invitations: Array<{ id: string; email: string; status: string; createdAt: string }>;
  receipts: ReceiptSummary[];
};

export type ReceiptItemAssignee = {
  id: string;
  user: { id: string; username: string };
};

export type ReceiptItem = {
  id: string;
  name: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  assignees: ReceiptItemAssignee[];
};

export type ReceiptSummary = {
  id: string;
  groupId: string;
  title: string | null;
  storeName: string | null;
  total: string | null;
  imagePath: string;
  createdAt: string;
  uploadedBy: { id: string; username: string };
  _count?: { items: number };
};

export type ReceiptDetail = ReceiptSummary & {
  items: ReceiptItem[];
  rawOcrText?: string | null;
  group: {
    id: string;
    name: string;
    members: GroupMember[];
  };
};

export type PendingInvitation = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
    owner: AuthUser;
    _count?: { members: number };
  };
  invitedBy: AuthUser;
};

export type AppView =
  | "home"
  | "createGroup"
  | "myGroups"
  | "groupDetail"
  | "scanReceipt"
  | "receiptDetail";
