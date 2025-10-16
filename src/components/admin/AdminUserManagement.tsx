import React, { useState, useEffect } from "react";
import { authSupabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Shield,
  User,
  UserCheck,
  UserX,
  Plus,
  Link as LinkIcon,
  RefreshCcw,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

interface User {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

export const AdminUserManagement: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [demoting, setDemoting] = useState<string | null>(null);
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invites, setInvites] = useState<
    Array<{
      id: string;
      email: string;
      invited_by: string;
      accepted: boolean;
      created_at: string;
      expires_at: string;
      token: string;
    }>
  >([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Move useEffect before early return to avoid conditional hook usage
  useEffect(() => {
    if (profile && profile.role === "admin") {
      fetchUsers();
      fetchInvites();
    }
  }, [profile]);

  // Check if current user is admin
  if (!profile || profile.role !== "admin") {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>You must be an admin to access user management.</AlertDescription>
      </Alert>
    );
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await authSupabase.rpc("get_users_for_admin" as any);

      if (error) {
        setError(`Failed to fetch users: ${error.message}`);
        return;
      }

      setUsers((data as User[]) || []);
    } catch (err) {
      setError(`Error fetching users: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      const { data, error } = await authSupabase.rpc("list_admin_invites" as any);
      if (error) {
        setError(`Failed to fetch invites: ${error.message}`);
        return;
      }
      setInvites((data as any[]) || []);
    } catch (err) {
      setError(`Error fetching invites: ${err}`);
    } finally {
      setInvitesLoading(false);
    }
  };

  const createInvite = async () => {
    if (!inviteEmail.trim()) {
      setError("Please enter an email to invite");
      return;
    }
    try {
      setInviteLoading(true);
      setError(null);
      setInviteToken(null);
      const { data, error } = await authSupabase.rpc("create_admin_invite" as any, {
        invitee_email: inviteEmail.trim(),
      });
      if (error) {
        setError(`Failed to create invite: ${error.message}`);
        return;
      }
      const token = data as string;
      setInviteToken(token);
      setSuccess("Invite created. Share the link below with the invitee.");
      setInviteEmail("");
      await fetchInvites();
      // Audit log
      await authSupabase.rpc("log_admin_action" as any, {
        action_type: "create_admin_invite",
        action_details: { token },
      });
    } catch (err) {
      setError(`Error creating invite: ${err}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      setPromoting(userId);
      setError(null);

      const { error } = await authSupabase.rpc("promote_to_admin" as any, {
        target_user_id: userId,
      });

      if (error) {
        setError(`Failed to promote user: ${error.message}`);
        return;
      }

      // Log the admin action
      await authSupabase.rpc("log_admin_action" as any, {
        action_type: "promote_to_admin",
        target_user_id: userId,
        action_details: { timestamp: new Date().toISOString() },
      });

      setSuccess("User promoted to admin successfully");
      await fetchUsers();
    } catch (err) {
      setError(`Error promoting user: ${err}`);
    } finally {
      setPromoting(null);
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    try {
      setDemoting(userId);
      setError(null);

      const { error } = await authSupabase.rpc("demote_from_admin" as any, {
        target_user_id: userId,
      });

      if (error) {
        setError(`Failed to demote user: ${error.message}`);
        return;
      }

      // Log the admin action
      await authSupabase.rpc("log_admin_action" as any, {
        action_type: "demote_from_admin",
        target_user_id: userId,
        action_details: { timestamp: new Date().toISOString() },
      });

      setSuccess("User demoted from admin successfully");
      await fetchUsers();
    } catch (err) {
      setError(`Error demoting user: ${err}`);
    } finally {
      setDemoting(null);
    }
  };

  const bootstrapFirstAdmin = async () => {
    if (!bootstrapEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    try {
      setBootstrapLoading(true);
      setError(null);

      const { error } = await authSupabase.rpc("bootstrap_first_admin" as any, {
        admin_email: bootstrapEmail.trim(),
      });

      if (error) {
        setError(`Failed to create admin: ${error.message}`);
        return;
      }

      setSuccess("First admin created successfully");
      setBootstrapEmail("");
      await fetchUsers();
    } catch (err) {
      setError(`Error creating admin: ${err}`);
    } finally {
      setBootstrapLoading(false);
    }
  };

  const manualVerifyEmail = async () => {
    if (!verifyEmail.trim()) {
      setError("Please enter an email address to verify");
      return;
    }

    try {
      setVerifyLoading(true);
      setError(null);

      const { error } = await authSupabase.rpc("manual_verify_user_email" as any, {
        target_email: verifyEmail.trim(),
      });

      if (error) {
        setError(`Failed to verify email: ${error.message}`);
        return;
      }

      setSuccess(`Email ${verifyEmail} has been manually verified successfully`);
      setVerifyEmail("");
      await fetchUsers();
    } catch (err) {
      setError(`Error verifying email: ${err}`);
    } finally {
      setVerifyLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasAdmins = users.some((user) => user.role === "admin");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. Only admins can access this section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" /> Invite New Admin
              </CardTitle>
              <CardDescription>
                Create an invite link for someone to sign up and become an admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="person@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button onClick={createInvite} disabled={inviteLoading} className="w-full">
                {inviteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invite"
                )}
              </Button>
              {inviteToken && (
                <div className="space-y-2">
                  <Label>Invite Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/admin/accept-invite?token=${inviteToken}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/admin/accept-invite?token=${inviteToken}`
                        )
                      }
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" /> Pending Invites
              </CardTitle>
              <CardDescription>Invites waiting to be accepted.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchInvites}
                  disabled={invitesLoading}
                >
                  {invitesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
              {invites.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending invites.</div>
              ) : (
                <div className="space-y-2">
                  {invites
                    .filter((inv) => !inv.accepted)
                    .map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{inv.email}</span>
                          <span className="text-muted-foreground ml-2">
                            expires {new Date(inv.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Link
                          to={`/admin/accept-invite?token=${inv.token}`}
                          className="text-primary hover:underline"
                        >
                          Open link
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {!hasAdmins && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bootstrap First Admin</CardTitle>
                <CardDescription>
                  No admin users exist. Create the first admin user.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-email">Admin Email</Label>
                  <Input
                    id="bootstrap-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={bootstrapFirstAdmin}
                  disabled={bootstrapLoading}
                  className="w-full"
                >
                  {bootstrapLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    "Create First Admin"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" /> Manual Email Verification
              </CardTitle>
              <CardDescription>
                Manually verify a user's email if they're stuck waiting for verification emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-email">Email to Verify</Label>
                <Input
                  id="verify-email"
                  type="email"
                  placeholder="user@example.com"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={manualVerifyEmail}
                disabled={verifyLoading}
                className="w-full"
                variant="outline"
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Verify Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Users</h3>
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.user_id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.email}</span>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? (
                                <>
                                  <Shield className="mr-1 h-3 w-3" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <User className="mr-1 h-3 w-3" />
                                  User
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined: {formatDate(user.created_at)}
                            {user.last_sign_in && (
                              <span className="ml-4">
                                Last sign in: {formatDate(user.last_sign_in)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {user.role === "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => demoteFromAdmin(user.user_id)}
                              disabled={
                                demoting === user.user_id || user.user_id === profile?.user_id
                              }
                            >
                              {demoting === user.user_id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <UserX className="mr-1 h-3 w-3" />
                              )}
                              Demote
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => promoteToAdmin(user.user_id)}
                              disabled={promoting === user.user_id}
                            >
                              {promoting === user.user_id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <UserCheck className="mr-1 h-3 w-3" />
                              )}
                              Promote to Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No users found.</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
