import { createIcons, icons } from 'lucide';
import './styles.css';

createIcons({ icons });

const previewButton = document.querySelector<HTMLButtonElement>('#previewButton');
const status = document.querySelector<HTMLSpanElement>('#status');

previewButton?.addEventListener('click', () => {
  if (!status || !previewButton) return;

  previewButton.disabled = true;
  previewButton.classList.add('cursor-wait', 'opacity-60');
  previewButton.innerHTML = '<i data-lucide="loader-circle" class="size-4"></i><span>Generating...</span>';
  createIcons({ icons });

  window.setTimeout(() => {
    previewButton.disabled = false;
    previewButton.classList.remove('cursor-wait', 'opacity-60');
    previewButton.innerHTML = '<i data-lucide="qr-code" class="size-4"></i><span>Generate</span>';
    status.className = 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700';
    status.innerHTML = '<i data-lucide="circle-check" class="size-4"></i><span>Action completed</span>';
    createIcons({ icons });
  }, 600);
});
