"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Store = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    setLoading(true);
    const { data, error } = await supabase.from("stores").select("*").order("name");
    if (error) setError(error.message);
    else setStores(data || []);
    setLoading(false);
  }

  async function handleAddStore(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("stores").insert({
      name,
      logo_url: logoUrl || null,
      description: description || null,
      street1: street1 || null,
      street2: street2 || null,
      city: city || null,
      region: region || null,
      postal_code: postalCode || null,
      country: country || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });
    if (error) setError(error.message);
    setName("");
    setLogoUrl("");
    setDescription("");
    setStreet1("");
    setStreet2("");
    setCity("");
    setRegion("");
    setPostalCode("");
    setCountry("");
    setLatitude("");
    setLongitude("");
    await fetchStores();
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Manage Stores</h1>
      <form onSubmit={handleAddStore} className="mb-10 bg-white dark:bg-gray-800 rounded shadow p-6 space-y-4 border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Store Name</label>
          <input
            className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
            placeholder="Store Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Logo URL (optional)</label>
          <input
            className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
            placeholder="Logo URL"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Description (optional)</label>
          <textarea
            className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Street Address 1</label>
            <input
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Street Address 1"
              value={street1}
              onChange={e => setStreet1(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Street Address 2 (optional)</label>
            <input
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Street Address 2"
              value={street2}
              onChange={e => setStreet2(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">City</label>
            <input
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="City"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Region/State/Province</label>
            <input
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Region/State/Province"
              value={region}
              onChange={e => setRegion(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Postal Code</label>
            <input
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Postal Code"
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Country</label>
            <input
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Country"
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Latitude (optional)</label>
            <input
              type="number"
              step="any"
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Latitude"
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Longitude (optional)</label>
            <input
              type="number"
              step="any"
              className="border p-2 w-full rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="Longitude"
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading || !name}
        >
          Add Store
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">All Stores</h2>
      {loading ? (
        <div>Loading...</div>
      ) : stores.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">No stores found.</div>
      ) : (
        <ul className="space-y-4">
          {stores.map(store => (
            <li key={store.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow p-4 flex flex-col md:flex-row md:items-center gap-4">
              {store.logo_url && <img src={store.logo_url} alt="logo" className="h-12 w-12 object-contain rounded" />}
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{store.name}</div>
                {store.description && <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">{store.description}</div>}
                <div className="text-gray-700 dark:text-gray-200 text-sm mt-2">
                  {store.street1 && <div>{store.street1}</div>}
                  {store.street2 && <div>{store.street2}</div>}
                  {store.city && <span>{store.city}, </span>}
                  {store.region && <span>{store.region}, </span>}
                  {store.postal_code && <span>{store.postal_code}, </span>}
                  {store.country && <span>{store.country}</span>}
                  {(store.latitude || store.longitude) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {store.latitude && <>Lat: {store.latitude} </>}
                      {store.longitude && <>Lng: {store.longitude}</>}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 