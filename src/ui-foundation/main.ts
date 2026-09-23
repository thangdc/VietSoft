import { createIcons, icons } from 'lucide';
import { badgeClass } from '../ui/badge';
import { buttonClass, setButtonLoading } from '../ui/button';
import { cardClass, cardPaddingClass } from '../ui/card';
import { checkboxClass, createCheckbox } from '../ui/checkbox';
import { inputClass } from '../ui/input';
import { selectClass } from '../ui/select';
import { textareaClass } from '../ui/textarea';
import { createTabs } from '../ui/tabs';
import { qrTypes } from '../features/qr-generator';
import './styles.css';

createIcons({ icons });

const previewButton = document.querySelector<HTMLButtonElement>('#previewButton');
const status = document.querySelector<HTMLSpanElement>('#status');
const content = document.querySelector<HTMLInputElement>('#content');
const selectedQrType = document.querySelector<HTMLElement>('#selectedQrType');
const qrTypeTabs = document.querySelector<HTMLElement>('#qrTypeTabs');
const demoSelect = document.querySelector<HTMLSelectElement>('#demoSelect');
const demoCheckbox = document.querySelector<HTMLInputElement>('#demoCheckbox');
const demoTextarea = document.querySelector<HTMLTextAreaElement>('#demoTextarea');

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

if (demoSelect) {
  demoSelect.className = selectClass();
  demoSelect.innerHTML = '<option value="L">Low</option><option value="M" selected>Medium</option><option value="Q">Quartile</option><option value="H">High</option>';
}

if (demoCheckbox) {
  createCheckbox(demoCheckbox, 'Include VietSoft logo');
}

if (demoTextarea) {
  demoTextarea.className = textareaClass();
}

if (status) {
  status.className = badgeClass('neutral');
}

if (qrTypeTabs && selectedQrType) {
  createTabs(
    qrTypeTabs,
    qrTypes.map(({ id, label, icon }) => ({ id, label, icon })),
    {
      activeId: 'url',
      onChange: (id) => {
        selectedQrType.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        createIcons({ icons });
      },
    },
  );
  createIcons({ icons });
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

