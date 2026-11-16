"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { deleteImageFromFirebase, uploadImageToFirebase } from "@/lib/firebase-storage";
import { useAuth } from "@/lib/state/auth-context";
import { useOrdersApi } from "@/lib/api/orders";
import { UpdateUserProfilePayload, UserProfile, useUserApi } from "@/lib/api/users";
import {
  emptyShippingAddress,
  normalizeShippingAddress,
  PreferredShippingAddress,
  readPreferredShippingAddress,
  shippingAddressHasContent,
  writePreferredShippingAddress,
} from "@/lib/shipping-address";
import { useLocation } from "@/lib/state/location-context";

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
  { value: "N", label: "Prefer not to say" },
];

const countryOptions = [
  { value: "USA", label: "United States" },
  { value: "Kenya", label: "Kenya" },
];

const shippingFieldClassName =
  "h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900";

export default function AccountPage() {
  const { auth, authLoading } = useAuth();
  const { getMe, updateMe } = useUserApi();
  const { getOrders } = useOrdersApi();
  const { location } = useLocation();
  const defaultCountryRef = useRef(location === "Kenya" ? "Kenya" : "USA");
  const isAuthenticated = Boolean(auth?.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingSuccess, setShippingSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageRef, setImageRef] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  const [shipping, setShipping] = useState<PreferredShippingAddress>(() =>
    emptyShippingAddress({ country: location === "Kenya" ? "Kenya" : "USA" })
  );
  const [savedShipping, setSavedShipping] = useState<PreferredShippingAddress | null>(
    null
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      setError(null);
      setShippingError(null);
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

        const fallbackCountry = defaultCountryRef.current;
        const preferred = readPreferredShippingAddress(data.id);
        let nextShipping = preferred;

        if (!shippingAddressHasContent(nextShipping)) {
          try {
            const orders = await getOrders();
            const latestWithAddress = [...orders]
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              .find((order) => order.shipping_address);

            if (latestWithAddress?.shipping_address) {
              nextShipping = normalizeShippingAddress(
                latestWithAddress.shipping_address,
                fallbackCountry
              );
            }
          } catch {
            // Keep preferred/profile defaults if order history is unavailable.
          }
        }

        const profileDefaults = emptyShippingAddress({
          full_name: [data.first_name, data.last_name].filter(Boolean).join(" ").trim(),
          phone: data.phone ?? "",
          email: data.email ?? "",
          country: fallbackCountry,
        });

        const resolved = normalizeShippingAddress(
          {
            ...profileDefaults,
            ...nextShipping,
            full_name: nextShipping?.full_name || profileDefaults.full_name,
            phone: nextShipping?.phone || profileDefaults.phone,
            email: nextShipping?.email || profileDefaults.email,
            country: nextShipping?.country || profileDefaults.country,
          },
          fallbackCountry
        );

        setShipping(resolved);
        setSavedShipping(resolved);
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
  }, [authLoading, getMe, getOrders, isAuthenticated]);

  const canEdit = isAuthenticated;

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

  const hasShippingChanges = useMemo(() => {
    if (!savedShipping) {
      return shippingAddressHasContent(shipping);
    }
    return (
      shipping.full_name !== savedShipping.full_name ||
      shipping.phone !== savedShipping.phone ||
      shipping.email !== savedShipping.email ||
      shipping.address_line_1 !== savedShipping.address_line_1 ||
      shipping.address_line_2 !== (savedShipping.address_line_2 ?? "") ||
      shipping.city !== savedShipping.city ||
      shipping.state !== (savedShipping.state ?? "") ||
      shipping.postal_code !== (savedShipping.postal_code ?? "") ||
      shipping.country !== savedShipping.country
    );
  }, [savedShipping, shipping]);

  const handleShippingChange = (
    field: keyof PreferredShippingAddress,
    value: string
  ) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (shippingError) {
      setShippingError(null);
    }
    if (shippingSuccess) {
      setShippingSuccess(null);
    }
  };

  const handleShippingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShippingError(null);
    setShippingSuccess(null);

    if (!canEdit || !profile) {
      setShippingError("You must be logged in to update your shipping address.");
      return;
    }

    const required: Array<keyof PreferredShippingAddress> = [
      "full_name",
      "phone",
      "email",
      "address_line_1",
      "city",
      "state",
      "postal_code",
      "country",
    ];
    const missing = required.filter((field) => !String(shipping[field] ?? "").trim());
    if (missing.length > 0) {
      setShippingError("Please fill in all required shipping fields.");
      return;
    }

    setSavingShipping(true);
    try {
      const normalized = normalizeShippingAddress(shipping);
      writePreferredShippingAddress(profile.id, normalized);
      setShipping(normalized);
      setSavedShipping(normalized);
      setShippingSuccess("Shipping address saved.");
    } catch {
      setShippingError("Unable to save shipping address.");
    } finally {
      setSavingShipping(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 pb-16 pt-10">
        <section className="rounded-2xl border border-[#4C1C59]/10 bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-64 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-[#4C1C59]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row lg:flex-col">
            <div className="flex w-full flex-col items-center gap-4 md:w-64 lg:w-full">
              <div className="h-36 w-36 animate-pulse rounded-full bg-[#4C1C59]/10" />
              <div className="h-3 w-40 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="grid flex-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 h-10 w-32 animate-pulse rounded-lg bg-[#4C1C59]/10" />
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 pb-16 pt-10">
        <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
          <p>Please sign in to manage your account.</p>
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
              Manage your profile, photo, and shipping address.
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

      <section className="mt-8 rounded-2xl border border-[#4C1C59]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Shipping address</h2>
          <p className="mt-1 text-sm text-gray-600">
            Used to prefill checkout. Update it anytime before your next order.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleShippingSubmit}>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-full-name">
              Full name
            </label>
            <input
              id="shipping-full-name"
              value={shipping.full_name}
              onChange={(event) => handleShippingChange("full_name", event.target.value)}
              className={shippingFieldClassName}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-phone">
              Phone
            </label>
            <input
              id="shipping-phone"
              value={shipping.phone}
              onChange={(event) => handleShippingChange("phone", event.target.value)}
              className={shippingFieldClassName}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-email">
              Email
            </label>
            <input
              id="shipping-email"
              type="email"
              value={shipping.email}
              onChange={(event) => handleShippingChange("email", event.target.value)}
              className={shippingFieldClassName}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-line-1">
              Address line 1
            </label>
            <input
              id="shipping-line-1"
              value={shipping.address_line_1}
              onChange={(event) =>
                handleShippingChange("address_line_1", event.target.value)
              }
              className={shippingFieldClassName}
              autoComplete="address-line1"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-line-2">
              Address line 2
            </label>
            <input
              id="shipping-line-2"
              value={shipping.address_line_2}
              onChange={(event) =>
                handleShippingChange("address_line_2", event.target.value)
              }
              className={shippingFieldClassName}
              autoComplete="address-line2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-city">
              City
            </label>
            <input
              id="shipping-city"
              value={shipping.city}
              onChange={(event) => handleShippingChange("city", event.target.value)}
              className={shippingFieldClassName}
              autoComplete="address-level2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-state">
              State / County
            </label>
            <input
              id="shipping-state"
              value={shipping.state}
              onChange={(event) => handleShippingChange("state", event.target.value)}
              className={shippingFieldClassName}
              autoComplete="address-level1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-postal">
              Postal code
            </label>
            <input
              id="shipping-postal"
              value={shipping.postal_code}
              onChange={(event) =>
                handleShippingChange("postal_code", event.target.value)
              }
              className={shippingFieldClassName}
              autoComplete="postal-code"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="shipping-country">
              Country
            </label>
            <select
              id="shipping-country"
              value={shipping.country}
              onChange={(event) => handleShippingChange("country", event.target.value)}
              className={`${shippingFieldClassName} bg-white`}
            >
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {shippingError && (
            <p className="text-sm text-red-600 md:col-span-2">{shippingError}</p>
          )}
          {shippingSuccess && (
            <p className="text-sm text-green-600 md:col-span-2">{shippingSuccess}</p>
          )}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={savingShipping || !hasShippingChanges}
              className="rounded-lg bg-[#4C1C59] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#361340] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingShipping ? "Saving..." : "Save shipping address"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
