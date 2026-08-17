import { addNote, listNotes } from '../../services/notes.service.js';
import { sanitizeText } from '../../utils/validation.js';
import { notesMenuKeyboard } from '../keyboards/notes.keyboard.js';
import { mainMenuKeyboard, cancelKeyboard } from '../keyboards/main.keyboard.js';

export function registerNotesCommand(bot) {
  bot.command('note', async (ctx) => {
    const content = ctx.message.text.replace(/^\/note\s*/i, '').trim();
    if (!content) {
      ctx.userSession?.set({ flow: 'note_add' });
      return ctx.reply('📝 أرسل نص الملاحظة أو الفكرة الآن:', {
        parse_mode: 'Markdown',
        ...cancelKeyboard()
      });
    }
    const cleanContent = sanitizeText(content, 2000);
    await addNote(ctx.state.user.id, cleanContent);
    return ctx.reply('✅ **حُفظت الملاحظة بنجاح.** 🌿', {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard()
    });
  });

  bot.command('notes', async (ctx) => {
    ctx.userSession?.clear();
    const { notes, page, totalPages } = await listNotes(ctx.state.user.id, { page: 1, limit: 6 });
    const text = notes.length > 0
      ? '📝 **ملاحظاتي وأفكاري:**\nاضغط على أي ملاحظة لعرضها أو حذفها:'
      : '📝 **ملاحظاتي**\n\nلا توجد ملاحظات محفوظة بعد. اضغط أدناه لإضافة ملاحظة جديدة:';

    return ctx.reply(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) });
  });
}
