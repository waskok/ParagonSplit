import { useCallback, useEffect, useMemo, useState } from "react";
import LoginView from "./views/LoginView";
import RegisterView from "./views/RegisterView";
import HomeView from "./views/HomeView";
import CreateGroupView from "./views/CreateGroupView";
import MyGroupsView from "./views/MyGroupsView";
import GroupDetailView from "./views/GroupDetailView";
import ScanReceiptView from "./views/ScanReceiptView";
import ReceiptDetailView from "./views/ReceiptDetailView";
import { loginRequest, registerRequest } from "./services/authService";
import { createGroup, fetchGroup, fetchMyGroups, fetchPendingInvitations, inviteToGroup, acceptInvitation, declineInvitation, removeGroupMember, deleteGroup } from "./services/groupService";
import { fetchReceipt, scanReceipt, deleteReceipt, updateReceiptTitle, updateReceiptItem, createReceiptItem, assignReceiptItem } from "./services/receiptService";
import type { AppView, GroupDetail, GroupSummary, PendingInvitation, ReceiptDetail } from "./types";

const TOKEN_KEY = "paragonsplit_token";
type AuthMode = "login" | "register";

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [view, setView] = useState<AppView>("home");
  const [createGroupBackView, setCreateGroupBackView] = useState<AppView>("home");
  const [toast, setToast] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [invitationActionError, setInvitationActionError] = useState("");
  const [actingOnInvitationId, setActingOnInvitationId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState("");

  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [receiptDetail, setReceiptDetail] = useState<ReceiptDetail | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const isLoggedIn = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const loadGroups = useCallback(async () => {
    if (!token) return;
    setGroupsLoading(true);
    setGroupsError("");
    setInvitationActionError("");
    try {
      const [groupsData, invitationsData] = await Promise.all([
        fetchMyGroups(token),
        fetchPendingInvitations(token)
      ]);
      setGroups(groupsData);
      setInvitations(invitationsData);
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : "Błąd ładowania grup.");
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  const loadGroup = useCallback(
    async (groupId: string) => {
      if (!token) return;
      setGroupLoading(true);
      setGroupError("");
      try {
        const data = await fetchGroup(token, groupId);
        setGroupDetail(data);
      } catch (err) {
        setGroupError(err instanceof Error ? err.message : "Błąd ładowania grupy.");
      } finally {
        setGroupLoading(false);
      }
    },
    [token]
  );

  const loadReceipt = useCallback(
    async (receiptId: string) => {
      if (!token) return;
      setReceiptLoading(true);
      setReceiptError("");
      try {
        const data = await fetchReceipt(token, receiptId);
        setReceiptDetail(data);
      } catch (err) {
        setReceiptError(err instanceof Error ? err.message : "Błąd ładowania paragonu.");
      } finally {
        setReceiptLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (view === "myGroups" && token) {
      loadGroups();
    }
  }, [view, token, loadGroups]);

  useEffect(() => {
    if (view === "groupDetail" && selectedGroupId && token) {
      loadGroup(selectedGroupId);
    }
  }, [view, selectedGroupId, token, loadGroup]);

  useEffect(() => {
    if (view === "receiptDetail" && selectedReceiptId && token) {
      loadReceipt(selectedReceiptId);
    }
  }, [view, selectedReceiptId, token, loadReceipt]);

  const handleRegister = async (payload: {
    username: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }) => {
    await registerRequest(payload);
  };

  const handleLogin = async (payload: { email: string; password: string }) => {
    const response = await loginRequest(payload);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setView("home");
    setToast("Zalogowano pomyślnie");
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthMode("login");
    setView("home");
    setToast(null);
    setSelectedGroupId(null);
    setSelectedReceiptId(null);
  };

  const handleCreateGroup = async (name: string) => {
    if (!token) return;
    const group = await createGroup(token, name);
    setSelectedGroupId(group.id);
    setView("groupDetail");
    setToast("Grupa utworzona");
  };

  const handleInvite = async (email: string): Promise<string> => {
    if (!token || !selectedGroupId) throw new Error("Brak grupy.");
    const result = await inviteToGroup(token, selectedGroupId, email);
    await loadGroup(selectedGroupId);
    return result.message;
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!token) return;
    setActingOnInvitationId(invitationId);
    setInvitationActionError("");
    try {
      const result = await acceptInvitation(token, invitationId);
      await loadGroups();
      setSelectedGroupId(result.groupId);
      setView("groupDetail");
      setToast(result.message);
    } catch (err) {
      setInvitationActionError(err instanceof Error ? err.message : "Nie udało się dołączyć.");
    } finally {
      setActingOnInvitationId(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!token) return;
    setActingOnInvitationId(invitationId);
    setInvitationActionError("");
    try {
      const result = await declineInvitation(token, invitationId);
      await loadGroups();
      setToast(result.message);
    } catch (err) {
      setInvitationActionError(err instanceof Error ? err.message : "Nie udało się odrzucić zaproszenia.");
    } finally {
      setActingOnInvitationId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!token || !selectedGroupId) return;
    await removeGroupMember(token, selectedGroupId, userId);
    await loadGroup(selectedGroupId);
    setToast("Użytkownik usunięty z grupy");
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!token) return;
    await deleteGroup(token, groupId);
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
      setGroupDetail(null);
    }
    await loadGroups();
    setToast("Grupa usunięta");
  };

  const handleDeleteGroupFromList = async (groupId: string, groupName: string) => {
    if (
      !window.confirm(
        `Usunąć grupę „${groupName}" wraz z paragonami? Tej operacji nie można cofnąć.`
      )
    ) {
      return;
    }
    setDeletingGroupId(groupId);
    setInvitationActionError("");
    try {
      await handleDeleteGroup(groupId);
    } catch (err) {
      setInvitationActionError(err instanceof Error ? err.message : "Nie udało się usunąć grupy.");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleScan = async (file: File, title: string) => {
    if (!token || !selectedGroupId) return;
    const receipt = await scanReceipt(token, selectedGroupId, file, title);
    setSelectedReceiptId(receipt.id);
    setReceiptDetail(receipt);
    setView("receiptDetail");
    setToast("Paragon zeskanowany");
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!token) return;
    await deleteReceipt(token, receiptId);
    if (selectedReceiptId === receiptId) {
      setSelectedReceiptId(null);
      setReceiptDetail(null);
    }
    if (selectedGroupId) await loadGroup(selectedGroupId);
    setToast("Paragon usunięty");
  };

  const handleUpdateReceiptTitle = async (receiptId: string, title: string) => {
    if (!token) return;
    const updated = await updateReceiptTitle(token, receiptId, title);
    if (selectedReceiptId === receiptId) {
      setReceiptDetail(updated);
    }
    if (selectedGroupId) await loadGroup(selectedGroupId);
    setToast("Nazwa zapisana");
  };

  const handleUpdateReceiptItem = async (
    itemId: string,
    payload: { name: string; totalPrice: number }
  ) => {
    if (!token || !selectedReceiptId) return;
    const updated = await updateReceiptItem(token, selectedReceiptId, itemId, payload);
    setReceiptDetail(updated);
    setToast("Pozycja zapisana");
  };

  const handleAddReceiptItem = async (payload: { name: string; totalPrice: number }) => {
    if (!token || !selectedReceiptId) return;
    const updated = await createReceiptItem(token, selectedReceiptId, payload);
    setReceiptDetail(updated);
    setToast("Pozycja dodana");
  };

  const handleAssignReceiptItem = async (itemId: string, userId: string) => {
    if (!token || !selectedReceiptId) return;
    const updated = await assignReceiptItem(token, selectedReceiptId, itemId, userId);
    setReceiptDetail(updated);
    setToast("Przypisanie zaktualizowane");
  };

  const handleDeleteReceiptFromDetail = async () => {
    if (!selectedReceiptId) return;
    await handleDeleteReceipt(selectedReceiptId);
    setView("groupDetail");
  };

  const handleUpdateReceiptTitleFromDetail = async (title: string) => {
    if (!selectedReceiptId) return;
    await handleUpdateReceiptTitle(selectedReceiptId, title);
  };

  if (isLoggedIn && token) {
    if (view === "createGroup") {
      return (
        <CreateGroupView
          onBack={() => setView(createGroupBackView)}
          onSubmit={handleCreateGroup}
        />
      );
    }

    if (view === "myGroups") {
      return (
        <MyGroupsView
          groups={groups}
          invitations={invitations}
          loading={groupsLoading}
          error={groupsError}
          actionError={invitationActionError}
          actingOnInvitationId={actingOnInvitationId}
          deletingGroupId={deletingGroupId}
          onBack={() => setView("home")}
          onCreateGroup={() => {
            setCreateGroupBackView("myGroups");
            setView("createGroup");
          }}
          onRefresh={loadGroups}
          onAcceptInvitation={handleAcceptInvitation}
          onDeclineInvitation={handleDeclineInvitation}
          onDeleteGroup={handleDeleteGroupFromList}
          onSelectGroup={(id) => {
            setSelectedGroupId(id);
            setView("groupDetail");
          }}
        />
      );
    }

    if (view === "groupDetail") {
      return (
        <GroupDetailView
          group={groupDetail}
          loading={groupLoading}
          error={groupError}
          onBack={() => setView("myGroups")}
          onScanReceipt={() => setView("scanReceipt")}
          onSelectReceipt={(id) => {
            setSelectedReceiptId(id);
            setView("receiptDetail");
          }}
          onInvite={handleInvite}
          onDeleteReceipt={handleDeleteReceipt}
          onUpdateReceiptTitle={handleUpdateReceiptTitle}
          onRemoveMember={handleRemoveMember}
          onDeleteGroup={async () => {
            if (!selectedGroupId) return;
            await handleDeleteGroup(selectedGroupId);
            setView("myGroups");
          }}
        />
      );
    }

    if (view === "scanReceipt") {
      return (
        <ScanReceiptView
          groupName={groupDetail?.name ?? "Grupa"}
          onBack={() => setView("groupDetail")}
          onScan={handleScan}
        />
      );
    }

    if (view === "receiptDetail") {
      return (
        <ReceiptDetailView
          receipt={receiptDetail}
          loading={receiptLoading}
          error={receiptError}
          onBack={() => setView("groupDetail")}
          onDelete={handleDeleteReceiptFromDetail}
          onUpdateTitle={handleUpdateReceiptTitleFromDetail}
          onUpdateItem={handleUpdateReceiptItem}
          onAddItem={handleAddReceiptItem}
          onAssignItem={handleAssignReceiptItem}
        />
      );
    }

    return (
      <HomeView
        toast={toast}
        onCreateGroup={() => {
          setCreateGroupBackView("home");
          setView("createGroup");
        }}
        onMyGroups={() => setView("myGroups")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center py-6">
        <header className="mb-5 px-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">ParagonSplit</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Logowanie, grupy i skan paragonów OCR — wszystko z telefonu.
          </p>
        </header>

        <div className="mb-4 grid grid-cols-2 rounded-2xl border border-orange-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              authMode === "login" ? "bg-orange-500 text-white" : "text-zinc-600 hover:bg-orange-50"
            }`}
            onClick={() => setAuthMode("login")}
          >
            Logowanie
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              authMode === "register"
                ? "bg-orange-500 text-white"
                : "text-zinc-600 hover:bg-orange-50"
            }`}
            onClick={() => setAuthMode("register")}
          >
            Rejestracja
          </button>
        </div>

        {authMode === "login" ? (
          <LoginView onSubmit={handleLogin} onSwitchToRegister={() => setAuthMode("register")} />
        ) : (
          <RegisterView onSubmit={handleRegister} onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </div>
    </main>
  );
}

export default App;
