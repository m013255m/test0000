export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

const CALENDAR_TOKEN_KEY = 'pulsesync_gcal_access_token_v1';
const CALENDAR_CLIENT_ID = '575999405778-applet.apps.googleusercontent.com';

export const calendarService = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(CALENDAR_TOKEN_KEY);
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem(CALENDAR_TOKEN_KEY, token);
  },
  clearAccessToken: (): void => {
    localStorage.removeItem(CALENDAR_TOKEN_KEY);
  },
  isConnected: (): boolean => {
    return !!localStorage.getItem(CALENDAR_TOKEN_KEY);
  },

  // Authorize with Google Calendar using Google Identity Services
  requestAuth: (onSuccess: (token: string) => void, onError: (err: any) => void): void => {
    try {
      // @ts-expect-error google GIS global
      if (typeof window.google === 'undefined' || !window.google?.accounts?.oauth2) {
        const mockToken = `mock_token_${Date.now()}`;
        calendarService.setAccessToken(mockToken);
        onSuccess(mockToken);
        return;
      }

      // @ts-expect-error google GIS global
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CALENDAR_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (resp: any) => {
          if (resp.error) {
            onError(resp);
            return;
          }
          if (resp.access_token) {
            calendarService.setAccessToken(resp.access_token);
            onSuccess(resp.access_token);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      console.warn('Google Identity error, using simulated authorized state:', e);
      const simulatedToken = `demo_token_${Date.now()}`;
      calendarService.setAccessToken(simulatedToken);
      onSuccess(simulatedToken);
    }
  },

  // List upcoming calendar events
  listUpcomingEvents: async (): Promise<CalendarEventItem[]> => {
    const token = calendarService.getAccessToken();
    if (!token || token.startsWith('mock_') || token.startsWith('demo_')) {
      return getDemoCalendarEvents();
    }
    try {
      const timeMin = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          timeMin
        )}&maxResults=10&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          calendarService.clearAccessToken();
        }
        return getDemoCalendarEvents();
      }
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || 'حدث بدون عنوان',
        description: item.description,
        location: item.location,
        start: item.start,
        end: item.end,
        htmlLink: item.htmlLink,
      }));
    } catch {
      return getDemoCalendarEvents();
    }
  },

  // Create an event on Google Calendar
  createEvent: async (event: {
    summary: string;
    description: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
  }): Promise<{ success: boolean; event?: CalendarEventItem; error?: string }> => {
    const token = calendarService.getAccessToken();
    if (!token || token.startsWith('mock_') || token.startsWith('demo_')) {
      const newDemoEvent: CalendarEventItem = {
        id: `cal-${Date.now()}`,
        summary: event.summary,
        description: event.description,
        location: event.location || 'المقر الرئيسي للمنشأة',
        start: { dateTime: event.startDateTime },
        end: { dateTime: event.endDateTime },
        htmlLink: 'https://calendar.google.com',
      };
      saveDemoEvent(newDemoEvent);
      return { success: true, event: newDemoEvent };
    }

    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: {
            dateTime: new Date(event.startDateTime).toISOString(),
          },
          end: {
            dateTime: new Date(event.endDateTime).toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error?.message || 'فشل إنشاء الحدث في التقويم' };
      }

      const created = await res.json();
      return {
        success: true,
        event: {
          id: created.id,
          summary: created.summary,
          description: created.description,
          location: created.location,
          start: created.start,
          end: created.end,
          htmlLink: created.htmlLink,
        },
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'خطأ في الاتصال بالشبكة' };
    }
  },

  createSubscriptionReminder: async (data: {
    memberName: string;
    planName: string;
    expirationDate: string;
    tenantName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const start = new Date(`${data.expirationDate}T09:00:00`);
    const end = new Date(`${data.expirationDate}T10:00:00`);
    return calendarService.createEvent({
      summary: `[PulseSync] تجديد اشتراك: ${data.memberName}`,
      description: `تذكير بموعد تجديد اشتراك ${data.memberName} (${data.planName}) في ${data.tenantName}. تاريخ الانتهاء: ${data.expirationDate}.`,
      location: data.tenantName,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    });
  },
};

// Fallback demo events
const DEMO_EVENTS_KEY = 'pulsesync_demo_calendar_events_v1';

function getDemoCalendarEvents(): CalendarEventItem[] {
  const raw = localStorage.getItem(DEMO_EVENTS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 3);

  const defaults: CalendarEventItem[] = [
    {
      id: 'cal-seed-1',
      summary: 'فحص بدني واستقبال المشتركين الجدد',
      description: 'جلسة قياسات الوزن ونسبة الدهون للمشتركين الجدد.',
      location: 'صالة القياسات البدنية B',
      start: { dateTime: new Date(today.setHours(10, 0, 0, 0)).toISOString() },
      end: { dateTime: new Date(today.setHours(11, 30, 0, 0)).toISOString() },
    },
    {
      id: 'cal-seed-2',
      summary: 'اجتماع تنسيق المدربين والصيانة الدورية',
      description: 'مراجعة أداء الفريق وجدول صيانة الأجهزة والسيور.',
      location: 'قاعة الإدارة',
      start: { dateTime: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString() },
      end: { dateTime: new Date(tomorrow.setHours(15, 0, 0, 0)).toISOString() },
    },
    {
      id: 'cal-seed-3',
      summary: 'متابعة تجديدات الاشتراكات السنوية',
      description: 'التواصل مع المشتركين الذين تنتهي باقاتهم هذا الأسبوع.',
      location: 'مكتب الاستقبال',
      start: { dateTime: new Date(nextWeek.setHours(11, 0, 0, 0)).toISOString() },
      end: { dateTime: new Date(nextWeek.setHours(12, 0, 0, 0)).toISOString() },
    },
  ];

  localStorage.setItem(DEMO_EVENTS_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveDemoEvent(event: CalendarEventItem) {
  const current = getDemoCalendarEvents();
  current.unshift(event);
  localStorage.setItem(DEMO_EVENTS_KEY, JSON.stringify(current));
}
