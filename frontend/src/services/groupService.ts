import { API_BASE_URL, getAuthHeaders, parseApiError } from "./apiClient";
import type { GroupDetail, GroupSummary, PendingInvitation } from "../types";

export const createGroup = async (token: string, name: string): Promise<GroupSummary> => {
  const response = await fetch(`${API_BASE_URL}/api/groups`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.group;
};

export const fetchMyGroups = async (token: string): Promise<GroupSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/api/groups`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.groups;
};

export const fetchPendingInvitations = async (token: string): Promise<PendingInvitation[]> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/invitations/pending`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.invitations;
};

export const acceptInvitation = async (
  token: string,
  invitationId: string
): Promise<{ message: string; groupId: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/invitations/${invitationId}/accept`, {
    method: "POST",
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
};

export const declineInvitation = async (
  token: string,
  invitationId: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/invitations/${invitationId}/decline`, {
    method: "POST",
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
};

export const fetchGroup = async (token: string, groupId: string): Promise<GroupDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const data = await response.json();
  return data.group;
};

export const inviteToGroup = async (
  token: string,
  groupId: string,
  email: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/invite`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
};

export const removeGroupMember = async (
  token: string,
  groupId: string,
  userId: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
};

export const deleteGroup = async (token: string, groupId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
};
