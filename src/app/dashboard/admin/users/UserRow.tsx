'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, UserCog, X, Copy, Check, AlertTriangle } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/Table';
import { forcePasswordReset, changeUserRole } from './actions';

interface UserRowProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
    mustChangePassword: boolean;
    lastLoginLabel: string;
  };
  viewerId: string;
  viewerRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
};

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-[#03296A] text-white',
  admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
};

export default function UserRow({ user, viewerId, viewerRole }: UserRowProps) {
  const router = useRouter();

  const isSelf = user.id === viewerId;
  const name = user.displayName || user.email;

  // Force reset is available to owner and admin viewers, never on your own
  // row, and an admin may not reset the owner — only the owner can.
  const canForceReset =
    (viewerRole === 'owner' || viewerRole === 'admin') &&
    !isSelf &&
    !(viewerRole === 'admin' && user.role === 'owner');
  const canChangeRole =
    viewerRole === 'owner' && !isSelf && user.role !== 'owner';

  // ── Force-reset modal state ──
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStage, setResetStage] = useState<'confirm' | 'done'>('confirm');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // ── Change-role modal state ──
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState(user.role);

  function openReset() {
    setResetStage('confirm');
    setResetError(null);
    setTempPassword('');
    setCopied(false);
    setResetOpen(true);
  }

  function closeReset() {
    const wasDone = resetStage === 'done';
    setResetOpen(false);
    // Refresh after a completed reset so the "Must change password" badge
    // and any other row state reflect the new database state.
    if (wasDone) {
      router.refresh();
    }
  }

  async function confirmReset() {
    setResetBusy(true);
    setResetError(null);
    const result = await forcePasswordReset(user.id);
    setResetBusy(false);
    if (result.success) {
      setTempPassword(result.tempPassword);
      setResetStage('done');
    } else {
      setResetError(result.error);
    }
  }

  async function copyTempPassword() {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API can fail in insecure contexts — the password stays
      // visible in the box for manual copy.
    }
  }

  function openRole() {
    setSelectedRole(user.role);
    setRoleError(null);
    setRoleOpen(true);
  }

  async function confirmRole() {
    setRoleBusy(true);
    setRoleError(null);
    const result = await changeUserRole(user.id, selectedRole);
    setRoleBusy(false);
    if (result.success) {
      setRoleOpen(false);
      router.refresh();
    } else {
      setRoleError(result.error);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-gray-900">
        {name}
        {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
      </TableCell>
      <TableCell className="text-gray-600">{user.email}</TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            ROLE_BADGE[user.role] ?? ROLE_BADGE.staff
          }`}
        >
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </TableCell>
      <TableCell className="text-gray-600">{user.lastLoginLabel}</TableCell>
      <TableCell>
        {user.mustChangePassword ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-[#C1282D]">
            Pending change
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
            OK
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {canForceReset && (
            <button
              onClick={openReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#C1282D] hover:bg-[#a82226] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C1282D]/40"
            >
              <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
              Force password reset
            </button>
          )}
          {canChangeRole && (
            <button
              onClick={openRole}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#03296A] bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#03296A]/40"
            >
              <UserCog className="w-3.5 h-3.5" aria-hidden="true" />
              Change role
            </button>
          )}
          {!canForceReset && !canChangeRole && (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>

        {/* ── Force-reset modal ── */}
        {resetOpen && (
          <ModalShell
            onClose={closeReset}
            title={resetStage === 'confirm' ? 'Force password reset' : 'Reset complete'}
          >
            {resetStage === 'confirm' ? (
              <>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This will reset{' '}
                  <strong className="text-gray-900">{name}</strong>&apos;s
                  password. They will be required to set a new one on next
                  login. Continue?
                </p>
                {resetError && (
                  <div
                    className="mt-3 bg-red-50 border border-red-200 rounded-md px-3 py-2"
                    role="alert"
                  >
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={closeReset}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReset}
                    disabled={resetBusy}
                    className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#C1282D] hover:bg-[#a82226] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    {resetBusy ? 'Resetting…' : 'Reset password'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-amber-800">
                    Copy this password and give it to {name} in person. It will
                    not be shown again.
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Temporary password
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 font-mono text-sm text-gray-900 select-all break-all">
                      {tempPassword}
                    </code>
                    <button
                      onClick={copyTempPassword}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium text-[#03296A] bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-150 shrink-0"
                      aria-label="Copy temporary password"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" aria-hidden="true" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={closeReset}
                    className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#03296A] hover:bg-[#02214F] transition-colors duration-150"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </ModalShell>
        )}

        {/* ── Change-role modal ── */}
        {roleOpen && (
          <ModalShell onClose={() => setRoleOpen(false)} title="Change role">
            <p className="text-sm text-gray-600">
              Set the role for{' '}
              <strong className="text-gray-900">{name}</strong>.
            </p>
            <div className="mt-4">
              <label
                htmlFor={`role-${user.id}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id={`role-${user.id}`}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#03296A]/40 focus:border-[#03296A] transition-colors duration-150"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {roleError && (
              <div
                className="mt-3 bg-red-50 border border-red-200 rounded-md px-3 py-2"
                role="alert"
              >
                <p className="text-sm text-red-700">{roleError}</p>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRoleOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={confirmRole}
                disabled={roleBusy || selectedRole === user.role}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#03296A] hover:bg-[#02214F] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {roleBusy ? 'Saving…' : 'Save role'}
              </button>
            </div>
          </ModalShell>
        )}
      </TableCell>
    </TableRow>
  );
}

// Brand-matched modal: 50% black overlay, click-outside to close, 12px
// radius, 480px max width, X button top-right. whitespace-normal resets the
// nowrap inherited from the parent <td>.
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-xl shadow-xl whitespace-normal text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-[#03296A]">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#03296A]/40 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
