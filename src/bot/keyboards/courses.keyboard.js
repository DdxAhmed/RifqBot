import { Markup } from 'telegraf';
import { backToMainMenuButton } from './main.keyboard.js';

export const coursesMenuKeyboard = (courses = []) => {
  const rows = courses.map((c) => [
    Markup.button.callback(
      `📚 ${c.title} (${c.progress.completed}/${c.progress.total} - ${c.progress.percent}%)`,
      `crs_view:${c.id}`
    )
  ]);

  rows.push([Markup.button.callback('➕ إضافة كورس جديد', 'crs:add')]);
  rows.push([backToMainMenuButton()]);

  return Markup.inlineKeyboard(rows);
};

export const courseDetailKeyboard = (course) => {
  const rows = [];

  if (course.nextUnfinished) {
    rows.push([
      Markup.button.callback(
        `▶️ متابعة: ${course.nextUnfinished.title}`,
        `crs_tgl:${course.id}:${course.nextUnfinished.number}`
      )
    ]);
  }

  rows.push([
    Markup.button.callback('📑 عرض الدروس', `crs_ls:${course.id}`),
    Markup.button.callback('📝 إضافة ملاحظة', `crs_note:${course.id}`)
  ]);

  rows.push([
    Markup.button.callback('🗑️ حذف الكورس', `crs_del:${course.id}`),
    Markup.button.callback('🔙 كورساتي', 'nav:courses')
  ]);

  return Markup.inlineKeyboard(rows);
};

export const courseLessonsKeyboard = (course) => {
  const rows = [];

  // Group lessons in pairs for compact view
  for (let i = 0; i < course.lessons.length; i += 2) {
    const row = [];
    const l1 = course.lessons[i];
    row.push(
      Markup.button.callback(
        `${l1.completed ? '✅' : '⬜'} د${l1.number}: ${l1.title.slice(0, 14)}`,
        `crs_tgl:${course.id}:${l1.number}`
      )
    );

    if (i + 1 < course.lessons.length) {
      const l2 = course.lessons[i + 1];
      row.push(
        Markup.button.callback(
          `${l2.completed ? '✅' : '⬜'} د${l2.number}: ${l2.title.slice(0, 14)}`,
          `crs_tgl:${course.id}:${l2.number}`
        )
      );
    }
    rows.push(row);
  }

  rows.push([
    Markup.button.callback('➕ درس جديد', `crs_add_ls:${course.id}`),
    Markup.button.callback('🔙 تفاصيل الكورس', `crs_view:${course.id}`)
  ]);

  return Markup.inlineKeyboard(rows);
};
