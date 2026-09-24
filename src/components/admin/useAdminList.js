import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage, apiErrorMessages } from '../../redux/api';

const isMissingEndpoint = (error) => error?.response?.status === 404;

/**
 * Loads an admin list page's rows from `url`.
 *
 * Some pages (Blog, Gallery) are built ahead of their API. While the endpoint
 * doesn't exist yet the server answers 404, and the page shows `previewRows`
 * (the content already built into the website) with `preview` set, so the UI
 * can be used and reviewed. Once the endpoint exists, real data takes over
 * without any change here. `previewRows` must be a stable (module-level) array.
 */
export default function useAdminList(url, { label, previewRows } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(
    (initial = false) => {
      if (!initial) setRefreshing(true);
      api.get(url)
        .then((response) => {
          setRows(Array.isArray(response.data) ? response.data : []);
          setPreview(false);
          setError(null);
          setUpdatedAt(new Date());
        })
        .catch((err) => {
          if (previewRows && isMissingEndpoint(err)) {
            setRows(previewRows);
            setPreview(true);
            setError(null);
          } else {
            setError(apiErrorMessage(err, `Failed to load ${label}.`));
            console.error(err);
          }
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [url, label, previewRows]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  return { rows, setRows, loading, refreshing, error, preview, updatedAt, load };
}

// Messages for a failed save or delete. A 404 means the API for this page
// hasn't been built yet, which deserves a plainer explanation than "Not found".
export function saveErrorMessages(error, what, fallback) {
  if (isMissingEndpoint(error)) {
    return [`This can’t be saved yet: the server doesn’t have the ${what} API. It will work once the backend adds it.`];
  }
  return apiErrorMessages(error, fallback);
}
