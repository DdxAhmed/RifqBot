import {
  getCourseDetails,
  toggleLessonCompletion,
  deleteCourse
} from '../../services/course.service.js';
import { recordUserActivity } from '../../services/streak.service.js';
import {
  courseDetailKeyboard,
  courseLessonsKeyboard
} from '../keyboards/courses.keyboard.js';
import { cancelKeyboard, backKeyboard } from '../keyboards/main.keyboard.js';

export function registerCourseHandlers(bot) {
  // Start add course flow
  bot.action('crs:add', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'course_add', step: 'title' });
    return ctx.editMessageText(
      '📚 **إضافة كورس أو مسار تعليمي جديد**\n\nأرسل اسم الكورس أو الكتاب (مثل: كورس بايثون، كتاب الأذكار، دورة المحاسبة):',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    ).catch(() => ctx.reply('أرسل اسم الكورس:', cancelKeyboard()));
  });

  // View course details
  bot.action(/^crs_view:(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});

    const course = await getCourseDetails(courseId, ctx.state.user.id, ctx.state.user.timezone);
    if (!course) {
      return ctx.editMessageText('عذرًا، لم يتم العثور على الكورس.', backKeyboard('nav:courses'));
    }

    const { progress } = course;
    const barLength = 10;
    const filledCount = Math.round((progress.percent / 100) * barLength);
    const progressBar = '🟩'.repeat(filledCount) + '⬜'.repeat(barLength - filledCount);

    let text = `📚 **${course.title}**\n\n` +
      `📊 **التقدم:** ${progressBar} (${progress.percent}%)\n` +
      `🔢 **الدروس:** ${progress.completed} من ${progress.total} مكتملة (متبقي ${progress.remaining})\n`;

    if (progress.paceInfo) {
      const { paceInfo } = progress;
      text += '\n🎯 **خطة الإنجاز:**\n' +
        `📅 تاريخ الهدف: ${paceInfo.targetDateFormatted}\n` +
        `⏱️ الأيام المتبقية: ${paceInfo.daysRemaining} يوم\n` +
        `📌 المعدل المطلوب: **${paceInfo.requiredLessonsPerDay} درس/يوم**\n`;
      if (paceInfo.isBehindSchedule) {
        text += '⚠️ أنت متأخر قليلًا عن الجدول، حاول زيادة وتيرتك.\n';
      }
    }

    if (course.notes && course.notes.length > 0) {
      text += '\n📝 **أحدث الملاحظات:**\n';
      course.notes.slice(0, 3).forEach((n, i) => {
        text += `  ${i + 1}. ${n.content}\n`;
      });
    }

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...courseDetailKeyboard(course) });
  });

  // List lessons for course
  bot.action(/^crs_ls:(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});

    const course = await getCourseDetails(courseId, ctx.state.user.id, ctx.state.user.timezone);
    if (!course) {
      return ctx.editMessageText('عذرًا، لم يتم العثور على الكورس.', backKeyboard('nav:courses'));
    }

    const text = `📑 **دروس: ${course.title}**\n` +
      'اضغط على أي درس لتبديل حالة الإنجاز (✅ مكتمل / ⬜ متبقي):';

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...courseLessonsKeyboard(course) });
  });

  // Toggle lesson completion
  bot.action(/^crs_tgl:(\d+):(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1], 10);
    const lessonNum = parseInt(ctx.match[2], 10);

    const result = await toggleLessonCompletion(courseId, lessonNum, ctx.state.user.id);
    if (!result) {
      await ctx.answerCbQuery('تعذر تحديث الدرس').catch(() => {});
      return;
    }

    if (result.lesson.completed) {
      await recordUserActivity(ctx.state.user.id, 'LESSON_COMPLETED', result.lesson.id, { courseId }, ctx.state.user.timezone);
      await ctx.answerCbQuery(`🎉 تم إكمال الدرس ${lessonNum}! أحسنت.`).catch(() => {});
    } else {
      await ctx.answerCbQuery(`تم إلغاء إكمال الدرس ${lessonNum}.`).catch(() => {});
    }

    // Refresh course view
    const course = await getCourseDetails(courseId, ctx.state.user.id, ctx.state.user.timezone);
    if (!course) return;

    const { progress } = course;
    const barLength = 10;
    const filledCount = Math.round((progress.percent / 100) * barLength);
    const progressBar = '🟩'.repeat(filledCount) + '⬜'.repeat(barLength - filledCount);

    let text = `📚 **${course.title}**\n\n` +
      `📊 **التقدم:** ${progressBar} (${progress.percent}%)\n` +
      `🔢 **الدروس:** ${progress.completed} من ${progress.total} مكتملة (متبقي ${progress.remaining})\n`;

    if (progress.paceInfo) {
      text += `📌 المعدل المطلوب: **${progress.paceInfo.requiredLessonsPerDay} درس/يوم**\n`;
    }

    return ctx.editMessageText(text, { parse_mode: 'Markdown', ...courseDetailKeyboard(course) })
      .catch(() => {});
  });

  // Prompt: Add course note
  bot.action(/^crs_note:(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'course_note_add', courseId });
    return ctx.editMessageText(
      '📝 **إضافة ملاحظة على الكورس**\n\nأرسل نص الملاحظة أو الفكرة المتعلقة بهذا الكورس:',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });

  // Prompt: Add new lesson to course
  bot.action(/^crs_add_ls:(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery().catch(() => {});
    ctx.userSession?.set({ flow: 'lesson_add', courseId });
    return ctx.editMessageText(
      '➕ **إضافة درس جديد**\n\nأرسل عنوان الدرس الجديد:',
      { parse_mode: 'Markdown', ...cancelKeyboard() }
    );
  });

  // Delete course
  bot.action(/^crs_del:(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1], 10);
    await deleteCourse(courseId, ctx.state.user.id);
    await ctx.answerCbQuery('🗑️ تم حذف الكورس.').catch(() => {});
    return ctx.editMessageText('🗑️ **تم حذف الكورس وجميع دروسه بنجاح.**', {
      parse_mode: 'Markdown',
      ...backKeyboard('nav:courses')
    });
  });
}
