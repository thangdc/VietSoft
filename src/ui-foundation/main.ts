import { createIcons, icons } from 'lucide';
import { badgeClass } from '../ui/badge';
import { buttonClass, setButtonLoading } from '../ui/button';
import { cardClass, cardPaddingClass } from '../ui/card';
import { inputClass } from '../ui/input';
import './styles.css';

createIcons({ icons });

const previewButton = document.querySelector<HTMLButtonElement>('#previewButton');
const status = document.querySelector<HTMLSpanElement>('#status');
const content = document.querySelector<HTMLInputElement>('#content');

document.querySelectorAll<HTMLElement>('[data-ui-card]').forEach((card) => {
  card.className = [cardClass(), cardPaddingClass()].join(' ');
});

document.querySelectorAll<HTMLButtonElement>('[data-ui-button]').forEach((button) => {
  const variant = (button.dataset.variant || 'secondary') as 'primary' | 'secondary' | 'danger' | 'ghost';
  button.className = buttonClass(variant, 'md');
});

if (content) {
  content.className = inputClass();
}

if (status) {
  status.className = badgeClass('neutral');
}

previewButton?.addEventListener('click', () => {
  if (!status || !previewButton) return;

  setButtonLoading(previewButton, true, 'Generate');
  createIcons({ icons });

  window.setTimeout(() => {
    setButtonLoading(previewButton, false, 'Generate');
    status.className = badgeClass('success');
    status.innerHTML = '<i data-lucide="circle-check" class="size-4"></i><span>Action completed</span>';
    createIcons({ icons });
  }, 600);
});
