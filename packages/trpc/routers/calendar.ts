import { baseProcedure, createTRPCRouter } from "../init";
import { db } from "@repo/db";
import { calendar_events } from "@repo/db/schema";
import { CalendarEvent, EventColor } from "@repo/types";
import {
  createCalendarEventSchema,
  deleteCalendarEventSchema,
  updateCalendarEventSchema,
} from "@repo/types";
import { GetUserSession, getCalendarClient } from "../utils/google-auth";

// Map Google Calendar colors to our EventColor type
const colorMap: { [key: string]: EventColor } = {
  "1": "blue",    // Lavender
  "2": "emerald", // Sage
  "3": "violet",  // Grape
  "4": "rose",    // Flamingo
  "5": "orange",  // Banana
  "6": "blue",    // Tangerine
  "7": "violet",  // Peacock
  "8": "emerald", // Graphite
  "9": "orange",  // Blueberry
  "10": "rose",   // Basil
  "11": "blue",   // Tomato
};

export const calendarRouter = createTRPCRouter({
  getCalendarEvents: baseProcedure.query(async () => {
    try {
      const session = await GetUserSession();
      const userId = session.id;
      const calendar = await getCalendarClient(userId);

      const calendarInfo = await calendar.calendars.get({
        calendarId: 'primary',
      });

      const userTimeZone = calendarInfo.data.timeZone;

      const getHolidayCalendarId = (timeZone: string): string => {
        if (timeZone.startsWith('Asia/')) {
          if (timeZone === 'Asia/Kolkata') {
            return 'en.indian#holiday@group.v.calendar.google.com';
          }
          if (timeZone.includes('Shanghai') || timeZone.includes('Beijing') || timeZone.includes('Hong_Kong')) {
            return 'zh.china#holiday@group.v.calendar.google.com';
          }
          if (timeZone === 'Asia/Tokyo') {
            return 'ja.japanese#holiday@group.v.calendar.google.com';
          }
          if (timeZone === 'Asia/Singapore') {
            return 'en.singapore#holiday@group.v.calendar.google.com';
          }
        }

        if (timeZone.startsWith('Europe/')) {
          if (timeZone === 'Europe/London') {
            return 'en.uk#holiday@group.v.calendar.google.com';
          }
          return 'en.european#holiday@group.v.calendar.google.com';
        }

        if (timeZone.startsWith('Australia/') || timeZone.startsWith('Pacific/Auckland')) {
          return 'en.australian#holiday@group.v.calendar.google.com';
        }
        return 'en.usa#holiday@group.v.calendar.google.com';
      };

      const holidayCalendarId = getHolidayCalendarId(userTimeZone as string);

      const colors = await calendar.colors.get();
      const eventColors = colors.data.event || {};

      const fetchEventsWithRetry = async (calendarId: string, isHoliday = false) => {
        try {
          return await calendar.events.list({
            calendarId,
            timeMin: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
            timeMax: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            ...(calendarId === 'primary' && { maxResults: 2500 }),
          });
        } catch (error) {
          if (isHoliday) {
            console.warn('Holiday calendar access failed:', error);
            return { data: { items: [] } };
          }
          throw error;
        }
      };

      const response = await fetchEventsWithRetry('primary');
      const holidayResponse = await fetchEventsWithRetry(holidayCalendarId, true);

      const events = response.data.items || [];
      const holidayEvents = holidayResponse.data.items || [];
      const allEvents = [...events, ...holidayEvents];

      const transformedEvents = allEvents.map(event => {
        const startDateTime = event.start?.dateTime || event.start?.date;
        const endDateTime = event.end?.dateTime || event.end?.date;

        if (!startDateTime || !endDateTime) return null;

        const attendees = event.attendees?.map(attendee => ({
          email: attendee.email || '',
          displayName: attendee.displayName || undefined,
          photoUrl: undefined,
          responseStatus: attendee.responseStatus || 'needsAction',
          optional: attendee.optional || false,
          organizer: attendee.organizer || false
        })) || [];

        const isHoliday = holidayEvents.includes(event);
        const color = event.colorId
          ? colorMap[event.colorId] || "blue"
          : isHoliday
            ? "rose"
            : "blue";

        const calendarEvent: CalendarEvent = {
          id: event.id || '',
          title: event.summary || 'Untitled Event',
          description: event.description || undefined,
          start: new Date(startDateTime),
          end: new Date(endDateTime),
          allDay: !event.start?.dateTime,
          location: event.location || undefined,
          attendees,
          color
        };

        return calendarEvent;
      }).filter((event): event is CalendarEvent => event !== null);

      for (const event of transformedEvents) {
        await db
          .insert(calendar_events)
          .values({
            id: event.id,
            summary: event.title,
            description: event.description || "",
            startTime: event.start,
            endTime: event.end,
            location: event.location || "",
            attendees: event.attendees || [],
            status: "confirmed",
            event_created_at: new Date(),
            event_updated_at: new Date(),
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: calendar_events.id,
            set: {
              summary: event.title,
              description: event.description || "",
              startTime: event.start,
              endTime: event.end,
              location: event.location || "",
              attendees: event.attendees || [],
              updatedAt: new Date(),
            },
          });
      }

      return {
        events: transformedEvents,
        status: 200
      };
    } catch (error) {
      console.error('Calendar fetch error:', error);
      if (error instanceof Error) {
        if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired')) {
          throw new Error("Your Google account session has expired. Please reconnect your Google account.");
        }
        if (error.message.includes('insufficient authentication scopes')) {
          throw new Error("Insufficient permissions. Please reconnect your Google account with proper calendar access.");
        }
        throw new Error(error.message);
      }

      throw new Error("Failed to fetch calendar events");
    }
  }),

  createCalendarEvent: baseProcedure
    .input(createCalendarEventSchema)
    .mutation(async ({ input }) => {
      try {
        const session = await GetUserSession();
        const userId = session.id;
        const calendar = await getCalendarClient(userId);

        const calendarInfo = await calendar.calendars.get({
          calendarId: "primary",
        });

        const userTimeZone = calendarInfo.data.timeZone;

        const createdEvent = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: input.summary,
            description: input.description,
            start: {
              dateTime: input.start,
              timeZone: userTimeZone,
            },
            end: {
              dateTime: input.end,
              timeZone: userTimeZone,
            },
          },
        });

        return {
          event: createdEvent.data,
          status: 200,
        } as const;
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to create calendar event",
        );
      }
    }),

  updateCalendarEvent: baseProcedure
    .input(updateCalendarEventSchema)
    .mutation(async ({ input }) => {
      try {
        const session = await GetUserSession();
        const userId = session.id;
        const calendar = await getCalendarClient(userId);

        const calendarInfo = await calendar.calendars.get({
          calendarId: "primary",
        });

        const userTimeZone = calendarInfo.data.timeZone;

        const updatedEvent = await calendar.events.update({
          calendarId: "primary",
          eventId: input.id,
          requestBody: {
            summary: input.summary,
            description: input.description,
            start: {
              dateTime: input.start,
              timeZone: userTimeZone,
            },
            end: {
              dateTime: input.end,
              timeZone: userTimeZone,
            },
          },
        });

        return {
          event: updatedEvent.data,
          status: 200,
        } as const;
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to update calendar event",
        );
      }
    }),

  deleteCalendarEvent: baseProcedure
    .input(deleteCalendarEventSchema)
    .mutation(async ({ input }) => {
      try {
        const session = await GetUserSession();
        const userId = session.id;
        const calendar = await getCalendarClient(userId);

        await calendar.events.delete({
          calendarId: "primary",
          eventId: input.id,
        });

        return {
          status: 200,
          message: "Event deleted successfully",
        } as const;
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to delete calendar event",
        );
      }
    }),
}); 
