export async function loadProgress({ BACKEND, token }) {
  const res = await fetch(`${BACKEND}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load progress");
  }

  return res.json();
}