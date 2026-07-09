/**
 * 复制文本到剪贴板，优先使用 navigator.clipboard API，
 * 不可用时降级到 document.execCommand('copy')
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback: textarea + execCommand
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const ok = document.execCommand('copy');
    if (!ok) {
      throw new Error('execCommand copy returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
