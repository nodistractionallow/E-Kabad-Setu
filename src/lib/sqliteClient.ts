import type { EWasteLot, MaterialItem, CategoryApprovalRequest, PartnerRegistration, CollectorProfile, SqliteEngineStatus } from '../types';

export async function fetchSqliteStatus(): Promise<SqliteEngineStatus | null> {
  try {
    const res = await fetch('/api/storage/status');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json : null;
  } catch (err) {
    console.warn('[SQLite Client] Status check failed:', err);
    return null;
  }
}

export async function fetchSqliteLots(): Promise<EWasteLot[] | null> {
  try {
    const res = await fetch('/api/storage/lots');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.warn('[SQLite Client] Lots fetch failed:', err);
    return null;
  }
}

export async function fetchSqliteLotById(id: string): Promise<EWasteLot | null> {
  try {
    const res = await fetch(`/api/storage/lots/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch (err) {
    console.warn('[SQLite Client] Lot by id fetch failed:', err);
    return null;
  }
}

export async function saveLotToSqlite(lot: EWasteLot): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lot),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Save lot failed:', err);
    return false;
  }
}

export async function updateLotInSqlite(id: string, partial: Partial<EWasteLot>): Promise<boolean> {
  try {
    const res = await fetch(`/api/storage/lots/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Update lot failed:', err);
    return false;
  }
}

export async function deleteLotFromSqlite(id: string, adminKey: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/storage/lots/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Delete lot failed:', err);
    return false;
  }
}

export async function fetchSqliteMaterials(): Promise<MaterialItem[] | null> {
  try {
    const res = await fetch('/api/storage/materials');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.warn('[SQLite Client] Materials fetch failed:', err);
    return null;
  }
}

export async function updateMaterialPriceInSqlite(id: string, pricePerKg: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/storage/materials/${encodeURIComponent(id)}/price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePerKg }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Update price failed:', err);
    return false;
  }
}

export async function fetchSqliteCategoryRequests(): Promise<CategoryApprovalRequest[] | null> {
  try {
    const res = await fetch('/api/storage/category-requests');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.warn('[SQLite Client] Category requests fetch failed:', err);
    return null;
  }
}

export async function saveCategoryRequestToSqlite(req: CategoryApprovalRequest): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/category-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Save category request failed:', err);
    return false;
  }
}

export async function updateCategoryRequestInSqlite(id: string, partial: Partial<CategoryApprovalRequest>): Promise<boolean> {
  try {
    const res = await fetch(`/api/storage/category-requests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Update category request failed:', err);
    return false;
  }
}

export async function fetchSqlitePartners(): Promise<PartnerRegistration[] | null> {
  try {
    const res = await fetch('/api/storage/partners');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch (err) {
    console.warn('[SQLite Client] Partners fetch failed:', err);
    return null;
  }
}

export async function savePartnerToSqlite(partner: PartnerRegistration): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partner),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Save partner failed:', err);
    return false;
  }
}

export async function updatePartnerInSqlite(id: string, partial: Partial<PartnerRegistration>): Promise<boolean> {
  try {
    const res = await fetch(`/api/storage/partners/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Update partner failed:', err);
    return false;
  }
}

export async function fetchSqliteCollector(): Promise<CollectorProfile | null> {
  try {
    const res = await fetch('/api/storage/collector');
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch (err) {
    console.warn('[SQLite Client] Collector fetch failed:', err);
    return null;
  }
}

export async function saveCollectorToSqlite(profile: CollectorProfile): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/collector', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Save collector failed:', err);
    return false;
  }
}

export async function runSqliteQuery(query: string): Promise<{ columns: string[]; rows: any[][]; error?: string }> {
  try {
    const res = await fetch('/api/storage/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { columns: [], rows: [], error: json.error || 'Failed to execute query' };
    }
    return { columns: json.columns || [], rows: json.rows || [] };
  } catch (err: any) {
    return { columns: [], rows: [], error: err?.message || 'Network error executing SQL' };
  }
}

export async function resetSqliteBackend(): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.warn('[SQLite Client] Reset failed:', err);
    return false;
  }
}
