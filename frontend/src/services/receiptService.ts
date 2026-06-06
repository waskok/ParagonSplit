import { API_BASE_URL, getAuthHeaders, parseApiError } from "./apiClient";
import type { ReceiptDetail, ReceiptItem, ReceiptSummary } from "../types";

export type PaymentSummaryEntry = {
  userId: string;
  username: string;
  amount: number;
};

export const getItemAssignees = (item: ReceiptItem) =>
  (item.assignees ?? []).map((a) => a.user);

export const computePaymentSummary = (items: ReceiptItem[]): PaymentSummaryEntry[] => {
  const map = new Map<string, PaymentSummaryEntry>();

  for (const item of items) {
    const people = getItemAssignees(item);
    if (people.length === 0) continue;

    const share = Number(item.totalPrice) / people.length;
    for (const person of people) {
      const current = map.get(person.id) ?? {
        userId: person.id,
        username: person.username,
        amount: 0
      };
      current.amount += share;
      map.set(person.id, current);
    }
  }

  return Array.from(map.values())
    .map((entry) => ({ ...entry, amount: Number(entry.amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount);
};

export const getReceiptDisplayName = (receipt: {
  title?: string | null;
  storeName?: string | null;
}): string => receipt.title?.trim() || receipt.storeName?.trim() || "Paragon";

export const scanReceipt = async (
  token: string,
  groupId: string,
  imageFile: File,
  title?: string
): Promise<ReceiptDetail> => {
  const formData = new FormData();
  formData.append("groupId", groupId);
  formData.append("image", imageFile);
  if (title?.trim()) {
    formData.append("title", title.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/receipts/scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipt;
};

export const fetchReceipt = async (token: string, receiptId: string): Promise<ReceiptDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipt;
};

export const fetchGroupReceipts = async (
  token: string,
  groupId: string
): Promise<ReceiptSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/group/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipts;
};

export const deleteReceipt = async (token: string, receiptId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

export const updateReceiptTitle = async (
  token: string,
  receiptId: string,
  title: string
): Promise<ReceiptDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ title })
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipt;
};

export const updateReceiptItem = async (
  token: string,
  receiptId: string,
  itemId: string,
  payload: { name?: string; totalPrice?: number }
): Promise<ReceiptDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}/items/${itemId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipt;
};

export const createReceiptItem = async (
  token: string,
  receiptId: string,
  payload: { name: string; totalPrice: number; quantity?: number }
): Promise<ReceiptDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}/items`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipt;
};

export const assignReceiptItem = async (
  token: string,
  receiptId: string,
  itemId: string,
  userId: string
): Promise<ReceiptDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}/items/${itemId}/assign`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId })
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.receipt;
};

export const fetchReceiptImageUrl = async (token: string, receiptId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/receipts/${receiptId}/image`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
