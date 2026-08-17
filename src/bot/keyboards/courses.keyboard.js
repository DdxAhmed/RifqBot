import { Markup } from 'telegraf';
import { homeButton, backButton } from './main.keyboard.js';

export const coursesMenuKeyboard = (courses = []) => {
  const rows = [];

  rows.push([
    Markup.button.callback('➕ إضافة كورس', 'crs:add')
  ]);

  if (courses.length > 0) {
    const hasUnfinished = courses.some((c) => c.progress.remaining > 0);
    if (hasUnfinished) {
      rows.push([
        Markup.button.callback('▶️ متابعة الكورس', 'crs:resume')
      ]);
    }
  }

  // Course list buttons
  courses.forEach((c) => {
    rows.push([
      Markup.button.callback(
        `📚 ${c.title} (${c.progress.completed}/${c.progress.total} - ${c.progress.percent}%)`,
        `crs_view:${c.id}`
      )
    ]);
  });

  rows.push([
    Markup.button.callback('📊 تقدمي', 'menu:progress')
  ]);

  rows.push([
    homeButton()
  ]);

  return Markup.inlineKeyboard(rows);
};

export const courseDetailKeyboard = (course) => {
  const rows = [];

  if (course.nextUnfinished) {
    rows.push([
      Markup.button.callback(
        `▶️ إكمال: ${course.nextUnfinished.title}`,
        `crs_tgl:${course.id}:${course.nextUnfinished.number}`
      )
    ]);
  }

  rows.push([
    Markup.button.callback('📑 عرض كل الدروس', `crs_ls:${course.id}`),
    Markup.button.callback('📝 إضافة ملاحظة', `crs_note:${course.id}`)
  ]);

  rows.push([
    Markup.button.callback('🗑️ حذف الكورس', `crs_del:${course.id}`)
  ]);

  rows.push([
    backButton('menu:courses'),
    homeButton()
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
    Markup.button.callback('➕ درس جديد', `crs_add_ls:${course.id}`)
  ]);

  rows.push([
    backButton(`crs_view:${course.id}`),
    homeButton()
  ]);

  return Markup.inlineKeyboard(rows);
};
