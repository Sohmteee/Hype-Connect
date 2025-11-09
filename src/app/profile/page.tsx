"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app, firestore } from "@/firebase";
import { updateProfile, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc as firestoreDoc, updateDoc } from 'firebase/firestore';
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountProfilePage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login?redirect=/profile');
      return;
    }
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: displayName || null, photoURL: photoURL || null });
      // Also try to update users/{uid} doc so header's user-meta stays in sync (best-effort)
      try {
        const uDoc = firestoreDoc(firestore, 'users', user.uid);
        await updateDoc(uDoc, { displayName: displayName || null, photoURL: photoURL || null });
      } catch (err) {
        // ignore failures (rules may prevent client write)
        console.debug('[profile] failed to update users doc:', err);
      }
      toast({ title: 'Saved', description: 'Account updated successfully' });
    } catch (err: any) {
      console.error('Update profile failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to update account', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (file?: File) => {
    if (!user || !file) return;
    const storage = getStorage(app);
    const filename = `profiles/${user.uid}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, filename);
    const uploadTask = uploadBytesResumable(sRef, file);

    setUploading(true);
    setUploadProgress(0);

    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(Math.round(progress));
    }, (error) => {
      console.error('Upload error', error);
      // If this is a permissions error, show a clearer message with next steps
      const code = (error && (error as any).code) || (error && (error as any).name) || '';
      if (String(code).includes('storage/unauthorized') || String(code).includes('unauthorized')) {
        toast({
          title: 'Upload blocked: permissions',
          description: 'You do not have permission to upload files. Check your Firebase Storage rules and allow authenticated users to write to profiles/{uid}/...',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Upload failed', description: String(error), variant: 'destructive' });
      }
      setUploading(false);
      setUploadProgress(null);
    }, async () => {
      try {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setPhotoURL(url);
        // update auth profile and users doc
        await updateProfile(user, { photoURL: url });
        try {
          const uDoc = firestoreDoc(firestore, 'users', user.uid);
          await updateDoc(uDoc, { photoURL: url });
        } catch (err) {
          console.debug('[profile] failed to update users doc after upload:', err);
        }
        toast({ title: 'Upload complete', description: 'Profile image uploaded' });
      } catch (err) {
        console.error('Getting download URL failed', err);
        toast({ title: 'Upload failed', description: 'Could not get file URL', variant: 'destructive' });
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    });
  };

  const handleUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await handleFileChange(f);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      // If the account was created via an OAuth provider (Google/Github) it may not have
      // an email/password credential. In that case, reauthentication with EmailAuthProvider
      // will always fail. Detect that and instruct the user to use password reset instead.
      const hasPasswordProvider = Array.isArray(user.providerData) &&
        user.providerData.some((p: any) => p?.providerId === 'password');
      if (!hasPasswordProvider) {
        toast({ title: 'Error', description: 'This account does not use a password sign-in. Use "Send Password Reset Email" instead.', variant: 'destructive' });
        setIsChangingPassword(false);
        return;
      }
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({ title: 'Success', description: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      // Map common Firebase auth errors to friendly messages and show as a toast.
      const code = err?.code || err?.name || '';
      let message = 'Failed to change password';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        message = 'Current password is incorrect.';
      } else if (code.includes('weak-password')) {
        message = 'The new password is too weak. Choose a stronger password.';
      } else if (err?.message) {
        message = err.message;
      }
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ title: 'Error', description: 'No email available for this account', variant: 'destructive' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: 'Password reset', description: 'Password reset email sent' });
    } catch (err: any) {
      console.error('Password reset error', err);
      toast({ title: 'Error', description: err?.message || 'Failed to send reset email', variant: 'destructive' });
    }
  };

  return (
    <>
      <Header />
      <main className="container py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Account Profile</h1>
          <p className="text-sm text-muted-foreground">Update your account details and security settings.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="photoURL">Profile Image</Label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleUploadInput} />
                  {uploading && uploadProgress !== null ? (
                    <div className="text-sm">Uploading: {uploadProgress}%</div>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">Upload an image to be used as your profile picture.</p>
                {photoURL ? (
                  <div className="mt-2">
                    <img src={photoURL} alt="Profile preview" className="h-24 w-24 rounded-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSaving} className="glowing-accent-btn">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handlePasswordReset}>
                  Send Password Reset Email
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password change card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" className="glowing-accent-btn" disabled={isChangingPassword}>{isChangingPassword ? 'Changing...' : 'Change Password'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
