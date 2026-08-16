import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const notesMenuKeyboard = (notes = [], page = 1, totalPages = 1) => {
  const rows = notes.map((n) => [
    Markup.button.callback(
      `📝 ${n.content.slice(0, 25)}${n.content.length > 25 ? '...' : ''}`,
      `note_view:${n.id}`
    ),
    Markup.button.callback('🗑️', `note_del:${n.id}`)
  ]);

  const navRow = [];
  if (page > 1) {
    navRow.push(Markup.button.callback('⬅️ السابق', `notes_pg:${page - 1}`));
  }
  if (totalPages > 1) {
    navRow.push(Markup.button.callback(`📄 ${page}/${totalPages}`, 'noop'));
  }
  if (page < totalPages) {
    navRow.push(Markup.button.callback('التالي ➡️', `notes_pg:${page + 1}`));
  }
  if (navRow.length > 0) {
    rows.push(navRow);
  }

  rows.push([
    Markup.button.callback('➕ إضافة ملاحظة جديدة', 'note:add'),
    Markup.button.callback('🔍 بحث في الملاحظات', 'note:search')
  ]);
  rows.push([backToMainMenuButton()]);

  return Markup.inlineKeyboard(rows);
};

export const noteViewKeyboard = (noteId) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🗑️ حذف الملاحظة', `note_del:${noteId}`),
      Markup.button.callback('🔙 قائمة الملاحظات', 'nav:notes')
    ]
  ]);
};
