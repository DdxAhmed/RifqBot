import { listUserCourses } from '../../services/course.service.js';
import { coursesMenuKeyboard } from '../keyboards/courses.keyboard.js';

export function registerCoursesCommand(bot) {
  bot.command(['courses', 'course'], async (ctx) => {
    ctx.userSession?.clear();
    const courses = await listUserCourses(ctx.state.user.id, ctx.state.user.timezone);
    const text = courses.length > 0
      ? '📚 **كورساتي ومسارات التعلّم:**\nاختر كورسًا للمتابعة أو أضف كورسًا جديدًا:'
      : '📚 **كورساتي**\n\nلم تقم بإضافة أي كورس بعد. يمكنك تنظيم تعلّمك بإضافة كورس الآن:';

    return ctx.reply(text, { parse_mode: 'Markdown', ...coursesMenuKeyboard(courses) });
  });
}
