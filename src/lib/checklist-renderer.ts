import type { ChecklistContent, ChecklistType, LanguagePreference } from '@/types';

async function loadChecklist(type: ChecklistType, lang: LanguagePreference): Promise<ChecklistContent> {
  const num = type.replace('checklist_', '');
  const mod = await import(`@/content/checklists/${lang}/checklist-${num}`);
  return mod.default as ChecklistContent;
}

export function renderChecklistsAsHtml(checklists: ChecklistContent[], lang: LanguagePreference): string {
  // When both checklist_1 and checklist_2 are present, merge them into one unified list
  const has1 = checklists.some(c => c.type === 'checklist_1');
  const has2 = checklists.some(c => c.type === 'checklist_2');

  let rendered = checklists
    .filter(c => {
      // If we have both 1 and 2, skip checklist_2 standalone — it gets merged into checklist_1
      if (has1 && has2 && c.type === 'checklist_2') return false;
      return true;
    })
    .map(checklist => {
      // Merge checklist_2 sections into checklist_1 if applicable
      let sections = checklist.sections;
      if (has1 && has2 && checklist.type === 'checklist_1') {
        const checklist2 = checklists.find(c => c.type === 'checklist_2');
        if (checklist2) {
          sections = [...sections, ...checklist2.sections];
        }
      }

      const sectionsHtml = sections.map(section => `
        <div style="margin-bottom:20px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
            ${section.title}
          </p>
          <ul style="margin:0;padding-left:20px;">
            ${section.items.map(item => `
              <li style="font-size:14px;color:#4b5563;margin-bottom:4px;line-height:1.5;">${item}</li>
            `).join('')}
          </ul>
        </div>
      `).join('');

      const sendToHtml = checklist.sendTo ? `
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280;font-style:italic;">
          ${lang === 'es' ? 'Envíe a:' : 'Send to:'} <strong>${checklist.sendTo}</strong>
        </p>
      ` : '';

      return `
        <div style="background-color:#f9fafb;border-radius:6px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
          <h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#1f2937;border-bottom:2px solid #1e40af;padding-bottom:8px;">
            ${checklist.title}
          </h3>
          ${sectionsHtml}
          ${sendToHtml}
        </div>
      `;
    })
    .join('');

  return rendered;
}

export async function loadAndRenderChecklists(
  checklistTypes: ChecklistType[],
  lang: LanguagePreference
): Promise<string> {
  const checklists = await Promise.all(
    checklistTypes.map(type => loadChecklist(type, lang))
  );
  return renderChecklistsAsHtml(checklists, lang);
}
