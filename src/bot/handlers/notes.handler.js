import {
  listNotes,
  deleteNote,
  searchNotes
} from '../../services/notes.service.js';
import { notesMenuKeyboard, noteViewKeyboard } from '../keyboards/notes.keyboard.js';
import { cancelKeyboard, backKeyboard } from '../keyboards/main.keyboard.js';
import { formatArabicDateTime } from '../../utils/timezone.js';

export function registerNotesHandlers(bot) {
  // Add note prompt
  bot.action('note:add', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'note_add' });
    return ctx.editMessageText(
      '📝 **إضافة ملاحظة جديدة**\n\nأرسل نص الملاحظة أو الفكرة الآن:',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    ).catch(() => ctx.reply('أرسل نص الملاحظة:', cancelKeyboard()));
  });

  // Search note prompt
  bot.action('note:search', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'note_search' });
    return ctx.editMessageText(
      '🔍 **البحث في الملاحظات**\n\nأرسل الكلمة المفتاحية المراد البحث عنها:',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });

  // Pagination for notes
  bot.action(/^notes_pg:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});

    const { notes, totalPages } = await listNotes(ctx.state.user.id, { page, limit: 6 });
    return ctx.editMessageText(
      '📝 **ملاحظاتك وأفكارك:**\nاضغط على أي ملاحظة لعرضها أو حذفها:',
      { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) }
    );
  });

  // View specific note
  bot.action(/^note_view:(\d+)$/, async (ctx) => {
    const noteId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});

    const notes = await searchNotes(ctx.state.user.id, '', 100);
    const note = notes.find((n) => n.id === noteId);

    if (!note) {
      return ctx.editMessageText('عذرًا، لم يتم العثور على الملاحظة.', backKeyboard('nav:notes'));
    }

    const dateStr = formatArabicDateTime(note.createdAt, ctx.state.user.timezone);
    const text = `📝 **الملاحظة** (${dateStr})\n\n${note.content}`;

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...noteViewKeyboard(note.id) });
  });

  // Delete note
  bot.action(/^note_del:(\d+)$/, async (ctx) => {
    const noteId = parseInt(ctx.match[1], 10);
    await deleteNote(noteId, ctx.state.user.id);
    await ctx.answerCbQuery('🗑️ تم حذف الملاحظة.').catch(() => {});

    const { notes, page, totalPages } = await listNotes(ctx.state.user.id, { page: 1, limit: 6 });
    const text = notes.length > 0
      ? '📝 **ملاحظاتك وأفكارك:**\nاضغط على أي ملاحظة لعرضها أو حذفها:'
      : '📝 **ملاحظاتي**\n\nلا توجد ملاحظات محفوظة بعد.';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) })
      .catch(() => {});
  });
}
