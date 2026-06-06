import { API_BASE_URL, getAuthHeaders, parseApiError } from "./apiClient";
import type { GroupDetail, GroupSummary } from "../types";

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
): Promise<{ message: string; added: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/invite`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
};
