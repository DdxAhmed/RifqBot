import { mainMenuKeyboard, persistentReplyKeyboard } from '../keyboards/main.keyboard.js';

export function registerStartCommand(bot) {
  bot.start(async (ctx) => {
    ctx.userSession?.clear();
    const name = ctx.from?.first_name ? ` يا ${ctx.from.first_name}` : '';
    const welcome = `أهلًا بك في رِفْق${name} 👋\n` +
      'مساعدك لتنظيم يومك ومتابعة أهدافك والتعلّم والأذكار براحة ودون تشتت.\n\n' +
      '📌 اختر من القائمة أدناه أو استخدم الأزرار للتنقل السريع:';

    // Send persistent reply keyboard if starting, with inline keyboard attached
    return ctx.reply(welcome, {
      ...persistentReplyKeyboard(),
      ...mainMenuKeyboard()
    });
  });
}
