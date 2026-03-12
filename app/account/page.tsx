"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { deleteImageFromFirebase, uploadImageToFirebase } from "@/lib/firebase-storage";
import { useAuth } from "@/lib/state/auth-context";
import { UpdateUserProfilePayload, UserProfile, useUserApi } from "@/lib/api/users";

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
  { value: "N", label: "Prefer not to say" },
];

export default function AccountPage() {
  const { auth } = useAuth();
  const { getMe, updateMe } = useUserApi();
  const accessToken = auth?.access ?? "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageRef, setImageRef] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setError(null);
      try {
        const data = await getMe();
        if (!isMounted) {
          return;
        }
        setProfile(data);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setGender(data.gender ?? "");
        setDateOfBirth(data.date_of_birth ?? "");
        setImageUrl(data.image_url ?? "");
        setImageRef(data.image_ref ?? "");
        setImagePreview(data.image_url ?? "");
      } catch (err) {
        if (isMounted) {
          setError("Unable to load account details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [getMe]);

  const canEdit = Boolean(accessToken);

  const hasChanges = useMemo(() => {
    if (!profile) {
      return false;
    }
    return (
      firstName !== (profile.first_name ?? "") ||
      lastName !== (profile.last_name ?? "") ||
      gender !== (profile.gender ?? "") ||
      dateOfBirth !== (profile.date_of_birth ?? "") ||
      imageUrl !== (profile.image_url ?? "") ||
      imageRef !== (profile.image_ref ?? "")
    );
  }, [profile, firstName, lastName, gender, dateOfBirth, imageUrl, imageRef]);

  const buildPayload = (): UpdateUserProfilePayload => {
    const payload: UpdateUserProfilePayload = {};
    if (!profile) {
      return payload;
    }
    if (firstName !== (profile.first_name ?? "")) {
      payload.first_name = firstName || "";
    }
    if (lastName !== (profile.last_name ?? "")) {
      payload.last_name = lastName || "";
    }
    if (gender !== (profile.gender ?? "")) {
      payload.gender = gender || "";
    }
    if (dateOfBirth !== (profile.date_of_birth ?? "")) {
      payload.date_of_birth = dateOfBirth || "";
    }
    if (imageUrl !== (profile.image_url ?? "")) {
      payload.image_url = imageUrl || "";
    }
    if (imageRef !== (profile.image_ref ?? "")) {
      payload.image_ref = imageRef || "";
    }
    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!canEdit) {
      setError("You must be logged in to update your account.");
      return;
    }
    if (!profile) {
      setError("Account data is missing.");
      return;
    }
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      setSuccess("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMe(payload);
      setProfile(updated);
      setSuccess("Account updated.");
    } catch (err) {
      setError("Unable to update account.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!canEdit) {
      setError("You must be logged in to update your image.");
      return;
    }
    setError(null);
    setUploadingImage(true);
    try {
      if (imageRef) {
        await deleteImageFromFirebase(imageRef);
      }
      const uploaded = await uploadImageToFirebase(file, {
        folder: "user-profiles",
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      });
      setImageUrl(uploaded.url);
      setImageRef(uploaded.refPath);
      setImagePreview(uploaded.url);
    } catch (err) {
      setError("Unable to upload profile image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!canEdit) {
      setError("You must be logged in to update your image.");
      return;
    }
    setError(null);
    setDeletingImage(true);
    try {
      if (imageRef) {
        await deleteImageFromFirebase(imageRef);
      }
      setImageUrl("");
      setImageRef("");
      setImagePreview("");
    } catch (err) {
      setError("Unable to delete profile image.");
    } finally {
      setDeletingImage(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 pb-16 pt-10">
        <section className="rounded-2xl border border-[#4C1C59]/10 bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
          <p className="text-sm text-gray-600">Loading account...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 pb-16 pt-10">
      <section className="rounded-2xl border border-[#4C1C59]/10 bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your profile information and profile image.
            </p>
          </div>
          {profile && (
            <div className="text-xs text-gray-500">
              <div>{profile.email}</div>
              <div>{profile.phone}</div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#4C1C59]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-6 md:flex-row lg:flex-col">
            <div className="flex w-full flex-col items-center gap-4 md:w-64 lg:w-full">
              <div className="relative h-36 w-36">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#4C1C59]/10 text-2xl font-semibold text-[#4C1C59]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    profile?.first_name?.[0]?.toUpperCase() ?? "U"
                  )}
                </div>
                <label className="absolute right-1 top-1 z-50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#4C1C59] shadow-sm transition hover:bg-white">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M4 13.5V16h2.5l7.3-7.3-2.5-2.5L4 13.5z" />
                    <path d="M14.7 7.3l-2.5-2.5 1.1-1.1c.4-.4 1-.4 1.4 0l1.1 1.1c.4.4.4 1 0 1.4l-1.1 1.1z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage || !canEdit}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleImageDelete}
                  disabled={deletingImage || !imageUrl}
                  className="absolute left-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Remove photo"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M6 7h8l-.7 9.1c-.1 1-1 1.9-2 1.9H8.7c-1 0-1.9-.8-2-1.9L6 7z" />
                    <path d="M8 5h4l.6 1H16v1H4V6h3.4L8 5z" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-xs text-gray-500">
                Uploads are resized to 500px wide.
              </p>
            </div>

            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="account-first-name">
                  First name
                </label>
                <input
                  id="account-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="account-last-name">
                  Last name
                </label>
                <input
                  id="account-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="account-gender">
                  Gender
                </label>
                <select
                  id="account-gender"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600" htmlFor="account-dob">
                  Date of birth
                </label>
                <input
                  id="account-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="rounded-lg bg-[#4C1C59] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#361340] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
