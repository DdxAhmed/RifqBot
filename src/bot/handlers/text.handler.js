import { createReminder } from '../../services/reminder.service.js';
import { createCourse, addCourseNote, addLessonToCourse, listUserCourses } from '../../services/course.service.js';
import { addGoal, listTodayGoals } from '../../services/goals.service.js';
import { addNote, searchNotes, listNotes } from '../../services/notes.service.js';
import { updateAdhkarSettings, getTodayAdhkarStatus } from '../../services/adhkar.service.js';
import { getUserSettings } from '../../services/settings.service.js';
import { getUserStatistics } from '../../services/statistics.service.js';
import { generateDailyPlan } from '../../services/plan.service.js';
import { listActiveReminders } from '../../services/reminder.service.js';
import { setBanStatus, getAllActiveTelegramIds, isUserAdmin } from '../../admin/services/admin.service.js';
import { parseDateTimeInput, sanitizeText, parsePositiveInt } from '../../utils/validation.js';
import { formatArabicDateTime } from '../../utils/timezone.js';
import {
  mainMenuKeyboard,
  quickAddKeyboard,
  cancelKeyboard,
  dailyPlanKeyboard,
  progressKeyboard,
  helpMenuKeyboard
} from '../keyboards/main.keyboard.js';
import { reminderRecurrenceKeyboard, remindersMenuKeyboard } from '../keyboards/reminders.keyboard.js';
import { notesMenuKeyboard } from '../keyboards/notes.keyboard.js';
import { coursesMenuKeyboard } from '../keyboards/courses.keyboard.js';
import { goalsMenuKeyboard } from '../keyboards/goals.keyboard.js';
import { adhkarMenuKeyboard } from '../keyboards/adhkar.keyboard.js';
import { settingsMenuKeyboard } from '../keyboards/settings.keyboard.js';
import { formatDailyPlanMessage } from '../commands/plan.command.js';
import { formatProgressMessage } from '../commands/progress.command.js';
import { formatHelpMessage } from '../commands/help.command.js';
import { logger } from '../../utils/logger.js';

export function registerTextHandler(bot) {
  bot.on('text', async (ctx) => {
    const rawText = ctx.message.text?.trim();
    if (!rawText || rawText.startsWith('/')) {
      return;
    }

    // 1. Intercept Persistent Reply Keyboard Taps
    switch (rawText) {
      case '📅 خطتي اليوم':
      case '📅 خطتي': {
        ctx.userSession?.clear();
        const plan = await generateDailyPlan(ctx.state.user.id, ctx.state.user.timezone);
        const text = formatDailyPlanMessage(plan, ctx.state.user.timezone);
        return ctx.reply(text, { parse_mode: 'Markdown', ...dailyPlanKeyboard() });
      }

      case '⏰ تذكيراتي':
      case '⏰ التذكيرات': {
        ctx.userSession?.clear();
        const active = await listActiveReminders(ctx.state.user.id);
        const countText = active.length > 0
          ? `لديك (${active.length}) تذكير نشط حاليًا.`
          : 'لا توجد تذكيرات نشطة حاليًا.';
        return ctx.reply(`⏰ **تذكيراتي**\n\n${countText}`, {
          parse_mode: 'Markdown',
          ...remindersMenuKeyboard()
        });
      }

      case '📚 كورساتي':
      case '📚 الكورسات': {
        ctx.userSession?.clear();
        const courses = await listUserCourses(ctx.state.user.id, ctx.state.user.timezone);
        const text = courses.length > 0
          ? '📚 **كورساتي ومسارات التعلّم:**'
          : '📚 **كورساتي**\n\nلم تقم بإضافة أي كورس بعد.';
        return ctx.reply(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) });
      }

      case '🎯 أهدافي':
      case '🎯 الأهداف': {
        ctx.userSession?.clear();
        const goals = await listTodayGoals(ctx.state.user.id, ctx.state.user.timezone);
        const text = goals.length > 0
          ? '🎯 **أهداف اليوم:**'
          : '🎯 **أهدافي**\n\nلا توجد أهداف مسجلة لليوم.';
        return ctx.reply(text, { parse_mode: 'Markdown', ...goalsMenuKeyboard(goals) });
      }

      case '📝 ملاحظاتي':
      case '📝 الملاحظات': {
        ctx.userSession?.clear();
        const { notes, page, totalPages } = await listNotes(ctx.state.user.id, { page: 1, limit: 6 });
        const text = notes.length > 0
          ? '📝 **ملاحظاتي وأفكاري:**'
          : '📝 **ملاحظاتي**\n\nلا توجد ملاحظات محفوظة بعد.';
        return ctx.reply(text, { parse_mode: 'Markdown', ...notesMenuKeyboard(notes, page, totalPages) });
      }

      case '🤲 أذكاري':
      case '🤲 الأذكار': {
        ctx.userSession?.clear();
        const todayStatus = await getTodayAdhkarStatus(ctx.state.user.id, ctx.state.user.timezone);
        return ctx.reply('🤲 **أذكاري اليومية**', {
          parse_mode: 'Markdown',
          ...adhkarMenuKeyboard(todayStatus)
        });
      }

      case '📊 تقدمي':
      case '📊 إحصائياتي': {
        ctx.userSession?.clear();
        const stats = await getUserStatistics(ctx.state.user.id);
        const text = formatProgressMessage(stats);
        return ctx.reply(text, { parse_mode: 'Markdown', ...progressKeyboard() });
      }

      case '⚙️ الإعدادات': {
        ctx.userSession?.clear();
        const settings = await getUserSettings(ctx.state.user.id);
        return ctx.reply('⚙️ **الإعدادات والتفضيلات**', {
          parse_mode: 'Markdown',
          ...settingsMenuKeyboard(settings, ctx.state.user)
        });
      }

      case '➕ إضافة': {
        ctx.userSession?.clear();
        return ctx.reply('➕ **ماذا تريد أن تضيف؟** 🌿', {
          parse_mode: 'Markdown',
          ...quickAddKeyboard()
        });
      }

      case '❓ المساعدة': {
        ctx.userSession?.clear();
        const text = formatHelpMessage();
        return ctx.reply(text, { parse_mode: 'Markdown', ...helpMenuKeyboard() });
      }

      case '🏠 الرئيسية': {
        ctx.userSession?.clear();
        const name = ctx.state.user.firstName ? ` يا ${ctx.state.user.firstName}` : '';
        return ctx.reply(`🏠 أهلًا بك في رِفْق${name} 🌿`, {
          parse_mode: 'Markdown',
          ...mainMenuKeyboard()
        });
      }
    }

    const session = ctx.userSession?.get();
    if (!session || !session.flow) {
      const name = ctx.state.user.firstName ? ` يا ${ctx.state.user.firstName}` : '';
      return ctx.reply(
        `أهلًا بك في رِفْق${name} 👋\n\nاختر ما تحتاجه من القائمة أدناه:`,
        mainMenuKeyboard()
      );
    }

    // 2. Reminder Add Flow
    if (session.flow === 'reminder_add') {
      if (session.step === 'title') {
        const title = sanitizeText(rawText, 150);
        session.title = title;
        session.step = 'recurrence';
        ctx.userSession?.set(session);

        return ctx.reply(
          `⏰ اختر تكرار التذكير لـ: **${title}**`,
          { parse_mode: 'Markdown', ...reminderRecurrenceKeyboard() }
        );
      }

      if (session.step === 'time') {
        const parsedDate = parseDateTimeInput(rawText, ctx.state.user.timezone);
        if (!parsedDate) {
          return ctx.reply(
            '⚠️ لم أتمكن من فهم الوقت المدخل بدقة.\n\nيرجى كتابة الوقت بصيغة واضحة مثل:\n• `20:00`\n• `بعد ساعة`\n• `غدا 09:30`',
            { parse_mode: 'Markdown', ...cancelKeyboard() }
          );
        }

        await createReminder(ctx.state.user.id, {
          title: session.title,
          dueAt: parsedDate,
          recurrence: session.recurrence || 'ONCE'
        });

        ctx.userSession?.clear();
        const timeFormatted = formatArabicDateTime(parsedDate, ctx.state.user.timezone);
        return ctx.reply(
          `✅ **تم حفظ التذكير بنجاح!**\n\n📌 العنوان: **${session.title}**\n📅 الموعد: ${timeFormatted}\n\nسننبهك في الموعد المحدد بإذن الله 🌿`,
          { parse_mode: 'Markdown', ...mainMenuKeyboard() }
        );
      }
    }

    // 3. Course Add Flow
    if (session.flow === 'course_add') {
      if (session.step === 'title') {
        session.title = sanitizeText(rawText, 150);
        session.step = 'lessons_count';
        ctx.userSession?.set(session);

        return ctx.reply(
          `📚 كم عدد دروس أو فصول **${session.title}**؟\n(أرسل رقمًا مثل: 10 أو 25، أو أرسل 0 لإضافتها لاحقًا):`,
          { parse_mode: 'Markdown', ...cancelKeyboard() }
        );
      }

      if (session.step === 'lessons_count') {
        const count = parseInt(rawText, 10);
        const totalLessons = Number.isFinite(count) && count > 0 ? count : 0;

        await createCourse(ctx.state.user.id, {
          title: session.title,
          totalLessons
        });

        ctx.userSession?.clear();
        return ctx.reply(
          `🎉 **تم إنشاء الكورس بنجاح!**\n\n📚 **${session.title}** (${totalLessons} درس).\nيمكنك الآن متابعة التقدم وتسجيل الدروس المكتملة.`,
          { parse_mode: 'Markdown', ...mainMenuKeyboard() }
        );
      }
    }

    // 4. Course Note Flow
    if (session.flow === 'course_note_add') {
      const content = sanitizeText(rawText, 1000);
      await addCourseNote(session.courseId, ctx.state.user.id, content);
      ctx.userSession?.clear();
      return ctx.reply('✅ **تم حفظ الملاحظة على الكورس بنجاح.** 🌿', {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard()
      });
    }

    // 5. Lesson Add Flow
    if (session.flow === 'lesson_add') {
      const lessonTitle = sanitizeText(rawText, 150);
      await addLessonToCourse(session.courseId, ctx.state.user.id, { title: lessonTitle });
      ctx.userSession?.clear();
      return ctx.reply('✅ **تمت إضافة الدرس الجديد بنجاح.** 🌿', {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard()
      });
    }

    // 6. Goal Add Flow
    if (session.flow === 'goal_add') {
      const title = sanitizeText(rawText, 200);
      await addGoal(ctx.state.user.id, title, ctx.state.user.timezone);
      ctx.userSession?.clear();
      return ctx.reply(`🎯 **تمت إضافة الهدف إلى خطتك اليومية:**\n\n"${title}"\nبالتوفيق في إنجازه! 🌿`, {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard()
      });
    }

    // 7. Note Add Flow
    if (session.flow === 'note_add') {
      const content = sanitizeText(rawText, 2000);
      await addNote(ctx.state.user.id, content);
      ctx.userSession?.clear();
      return ctx.reply('📝 **تم حفظ الملاحظة بنجاح.** 🌿', {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard()
      });
    }

    // 8. Note Search Flow
    if (session.flow === 'note_search') {
      const query = sanitizeText(rawText, 100);
      const results = await searchNotes(ctx.state.user.id, query, 10);
      ctx.userSession?.clear();

      if (results.length === 0) {
        return ctx.reply(`🔍 لم يتم العثور على ملاحظات تحتوي على: "${query}"`, mainMenuKeyboard());
      }

      return ctx.reply(
        `🔍 **نتائج البحث عن:** "${query}" (${results.length} ملاحظة):`,
        { parse_mode: 'Markdown', ...notesMenuKeyboard(results, 1, 1) }
      );
    }

    // 9. Adhkar Time Set Flow
    if (session.flow === 'adhkar_time_set') {
      const match = rawText.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        return ctx.reply('⚠️ يرجى إدخال الوقت بصيغة HH:mm مثل `06:00` أو `18:30`:', {
          parse_mode: 'Markdown',
          ...cancelKeyboard()
        });
      }

      const formattedTime = `${match[1].padStart(2, '0')}:${match[2]}`;
      const field = session.kind === 'morning' ? 'morningTime' : 'eveningTime';
      await updateAdhkarSettings(ctx.state.user.id, { [field]: formattedTime });
      ctx.userSession?.clear();

      const label = session.kind === 'morning' ? 'أذكار الصباح' : 'أذكار المساء';
      return ctx.reply(`✅ **تم تعديل وقت تنبيه ${label} إلى:** \`${formattedTime}\``, {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard()
      });
    }

    // 10. Admin Broadcast Flow
    if (session.flow === 'admin_broadcast') {
      if (!isUserAdmin(ctx.from.id)) {
        ctx.userSession?.clear();
        return ctx.reply('غير مصرح.');
      }

      const broadcastMsg = sanitizeText(rawText, 3000);
      const telegramIds = await getAllActiveTelegramIds();
      ctx.userSession?.clear();

      ctx.reply(`📢 جاري إرسال الرسالة إلى ${telegramIds.length} مستخدم...`);

      let successCount = 0;
      for (const tid of telegramIds) {
        try {
          await bot.telegram.sendMessage(Number(tid), `📢 **رسالة من إدارة رِفْق:**\n\n${broadcastMsg}`, {
            parse_mode: 'Markdown'
          });
          successCount++;
        } catch (err) {
          logger.warn(`Failed broadcast to ${tid}:`, err.message);
        }
      }

      return ctx.reply(`✅ تم إرسال الإذاعة بنجاح إلى (${successCount}/${telegramIds.length}) مستخدم.`, mainMenuKeyboard());
    }

    // 11. Admin Ban Toggle Flow
    if (session.flow === 'admin_ban_toggle') {
      if (!isUserAdmin(ctx.from.id)) {
        ctx.userSession?.clear();
        return ctx.reply('غير مصرح.');
      }

      const targetId = parsePositiveInt(rawText);
      if (!targetId) {
        return ctx.reply('⚠️ يرجى إدخال معرف Telegram صالح (أرقام فقط):', cancelKeyboard());
      }

      const updated = await setBanStatus(ctx.state.user.id, targetId, true);
      ctx.userSession?.clear();

      if (!updated) {
        return ctx.reply('لم يتم العثور على مستخدم بهذا المعرف.', mainMenuKeyboard());
      }

      return ctx.reply(`🚫 تم تحديث حالة الحظر للمستخدم ${targetId}.`, mainMenuKeyboard());
    }

    return ctx.reply('اختر ما تحتاجه من القائمة الرئيسية:', mainMenuKeyboard());
  });
}
