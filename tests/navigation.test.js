import test from 'node:test';
import assert from 'node:assert/strict';
import { BOT_COMMANDS_LIST } from '../src/bot/commands/index.js';
import {
  mainMenuKeyboard,
  quickAddKeyboard,
  persistentReplyKeyboard,
  dailyPlanKeyboard,
  progressKeyboard,
  helpMenuKeyboard,
  backKeyboard
} from '../src/bot/keyboards/main.keyboard.js';
import { remindersMenuKeyboard, completedRemindersKeyboard } from '../src/bot/keyboards/reminders.keyboard.js';
import { coursesMenuKeyboard, courseDetailKeyboard } from '../src/bot/keyboards/courses.keyboard.js';
import { goalsMenuKeyboard } from '../src/bot/keyboards/goals.keyboard.js';
import { notesMenuKeyboard } from '../src/bot/keyboards/notes.keyboard.js';
import { adhkarMenuKeyboard } from '../src/bot/keyboards/adhkar.keyboard.js';
import { settingsMenuKeyboard, timezonePickerKeyboard } from '../src/bot/keyboards/settings.keyboard.js';
import { formatDailyPlanMessage } from '../src/bot/commands/plan.command.js';
import { formatProgressMessage } from '../src/bot/commands/progress.command.js';
import { formatHelpMessage } from '../src/bot/commands/help.command.js';

test('Telegram Commands - All 10 official commands registered with Arabic descriptions', () => {
  const expectedCommands = [
    { command: 'start', description: '🏠 الرئيسية' },
    { command: 'plan', description: '📅 خطتي اليوم' },
    { command: 'reminders', description: '⏰ تذكيراتي' },
    { command: 'courses', description: '📚 كورساتي' },
    { command: 'goals', description: '🎯 أهدافي' },
    { command: 'notes', description: '📝 ملاحظاتي' },
    { command: 'adhkar', description: '🤲 أذكاري' },
    { command: 'progress', description: '📊 تقدمي' },
    { command: 'settings', description: '⚙️ الإعدادات' },
    { command: 'help', description: '❓ المساعدة' }
  ];

  assert.strictEqual(BOT_COMMANDS_LIST.length, 10);
  expectedCommands.forEach((exp) => {
    const found = BOT_COMMANDS_LIST.find((c) => c.command === exp.command);
    assert.ok(found, `Command ${exp.command} should be registered`);
    assert.strictEqual(found.description, exp.description);
  });
});

test('Main Menu Keyboard - Contains full Arabic buttons and correct callbacks', () => {
  const kb = mainMenuKeyboard();
  const inline = kb.reply_markup.inline_keyboard;
  assert.ok(inline.length >= 6);

  // Flatten callbacks
  const callbacks = inline.flat().map((btn) => btn.callback_data);
  assert.ok(callbacks.includes('menu:plan'));
  assert.ok(callbacks.includes('menu:add'));
  assert.ok(callbacks.includes('menu:reminders'));
  assert.ok(callbacks.includes('menu:courses'));
  assert.ok(callbacks.includes('menu:goals'));
  assert.ok(callbacks.includes('menu:notes'));
  assert.ok(callbacks.includes('menu:adhkar'));
  assert.ok(callbacks.includes('menu:progress'));
  assert.ok(callbacks.includes('menu:settings'));
  assert.ok(callbacks.includes('menu:help'));
});

test('Quick Add Keyboard - Contains 4 entity shortcuts and home button', () => {
  const kb = quickAddKeyboard();
  const callbacks = kb.reply_markup.inline_keyboard.flat().map((b) => b.callback_data);
  assert.ok(callbacks.includes('rem:add'));
  assert.ok(callbacks.includes('crs:add'));
  assert.ok(callbacks.includes('goal:add'));
  assert.ok(callbacks.includes('note:add'));
  assert.ok(callbacks.includes('menu:home'));
});

test('Persistent Reply Keyboard - Contains structured text buttons', () => {
  const kb = persistentReplyKeyboard();
  const rows = kb.reply_markup.keyboard;
  assert.ok(rows.length >= 5);
  const flattened = rows.flat();
  assert.ok(flattened.includes('📅 خطتي اليوم'));
  assert.ok(flattened.includes('⏰ تذكيراتي'));
  assert.ok(flattened.includes('📚 كورساتي'));
  assert.ok(flattened.includes('🎯 أهدافي'));
  assert.ok(flattened.includes('📝 ملاحظاتي'));
  assert.ok(flattened.includes('🤲 أذكاري'));
  assert.ok(flattened.includes('📊 تقدمي'));
  assert.ok(flattened.includes('⚙️ الإعدادات'));
});

test('Submenus - Reminders, Courses, Goals, Notes, Adhkar, Settings include Home navigation', () => {
  const checkHasHome = (kb) => {
    const callbacks = kb.reply_markup.inline_keyboard.flat().map((b) => b.callback_data);
    assert.ok(callbacks.includes('menu:home') || callbacks.includes('nav:main'), 'Must include home button');
  };

  checkHasHome(remindersMenuKeyboard());
  checkHasHome(completedRemindersKeyboard([]));
  checkHasHome(coursesMenuKeyboard([]));
  checkHasHome(courseDetailKeyboard({ title: 'Test', progress: { completed: 0, total: 5, percent: 0, remaining: 5 } }));
  checkHasHome(goalsMenuKeyboard([]));
  checkHasHome(notesMenuKeyboard([]));
  checkHasHome(adhkarMenuKeyboard({}));
  checkHasHome(settingsMenuKeyboard({}, { timezone: 'Asia/Riyadh' }));
  checkHasHome(timezonePickerKeyboard());
  checkHasHome(dailyPlanKeyboard());
  checkHasHome(progressKeyboard());
  checkHasHome(helpMenuKeyboard());
  checkHasHome(backKeyboard('menu:reminders'));
});

test('Message Formatters - Plan, Progress, and Help format clean Arabic text', () => {
  const dummyPlan = {
    dateFormatted: '17 أغسطس 2026',
    streak: { current: 3, longest: 10 },
    courses: [{ title: 'كورس بايثون', completed: 2, total: 10, percent: 20 }],
    goals: [{ title: 'مراجعة الملاحظات', completed: true }],
    reminders: [{ title: 'موعد الطبيب', dueAt: new Date() }],
    adhkar: { morningCompleted: true, eveningCompleted: false }
  };

  const planText = formatDailyPlanMessage(dummyPlan, 'Asia/Riyadh');
  assert.ok(planText.includes('خطتك اليوم'));
  assert.ok(planText.includes('كورس بايثون'));
  assert.ok(planText.includes('مراجعة الملاحظات'));

  const dummyStats = {
    currentStreak: 5,
    longestStreak: 12,
    completedReminders: 20,
    completedLessons: 15,
    completedGoals: 30,
    completedAdhkar: 40,
    activity7d: 14,
    activity30d: 50
  };
  const progressText = formatProgressMessage(dummyStats);
  assert.ok(progressText.includes('إحصائيات تقدمك'));
  assert.ok(progressText.includes('5 يوم'));
  assert.ok(progressText.includes('السلسلة الحالية'));

  const helpText = formatHelpMessage();
  assert.ok(helpText.includes('دليل مساعدة رِفْق'));
  assert.ok(helpText.includes('لست بحاجة لحفظ أي أوامر'));
});
