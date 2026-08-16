import { registerMenuHandlers } from './menu.handler.js';
import { registerReminderHandlers } from './reminders.handler.js';
import { registerCourseHandlers } from './courses.handler.js';
import { registerAdhkarHandlers } from './adhkar.handler.js';
import { registerGoalsHandlers } from './goals.handler.js';
import { registerNotesHandlers } from './notes.handler.js';
import { registerSettingsHandlers } from './settings.handler.js';
import { registerAdminHandlers } from '../../admin/handlers/admin.handler.js';
import { registerTextHandler } from './text.handler.js';

export function registerAllHandlers(bot) {
  // Callback handlers
  registerMenuHandlers(bot);
  registerReminderHandlers(bot);
  registerCourseHandlers(bot);
  registerAdhkarHandlers(bot);
  registerGoalsHandlers(bot);
  registerNotesHandlers(bot);
  registerSettingsHandlers(bot);
  registerAdminHandlers(bot);

  // Fallback / active flow text handler (must be registered after commands)
  registerTextHandler(bot);
}
