import type { BlueprintResponse, BuildRequest, BuildStatus } from '@/types';

const API_BASE = '/api';

function getBlueprintErrorMessage(status: number, detail: string): string {
  if (status === 400) return detail || 'Invalid image. Please upload a PNG, JPG, or WebP under 10MB.';
  if (status === 500) return detail || 'We couldn\'t analyze this image. Try a clearer photo or different style.';
  return detail || 'Something went wrong. Please try again.';
}

function getBuildErrorMessage(status: number, detail: string): string {
  if (status === 400) return detail || 'Invalid request. Check your blueprint and try again.';
  if (status >= 500) return detail || 'Minecraft server is unavailable. Check RCON settings and try again.';
  return detail || 'Build failed. Please try again.';
}

export async function generateBlueprint(
  imageFile: File,
  style: string = 'ghibli'
): Promise<BlueprintResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('style', style);

  const response = await fetch(`${API_BASE}/blueprint`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Unknown error' }));
    const detail = typeof body.detail === 'string' ? body.detail : 'Unknown error';
    throw new Error(getBlueprintErrorMessage(response.status, detail));
  }

  return response.json();
}

export async function buildInMinecraft(
  request: BuildRequest,
  onProgress?: (status: BuildStatus) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Unknown error' }));
    const detail = typeof body.detail === 'string' ? body.detail : 'Unknown error';
    throw new Error(getBuildErrorMessage(response.status, detail));
  }

  // Handle streaming response
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const data = JSON.parse(line);
        onProgress?.(data);
      } catch (e) {
        console.warn('Failed to parse progress data:', line);
      }
    }
  }
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Backend is not available');
  }
  return response.json();
}