import { logger } from "../utils/logger";

// ─── Mock Timetable Data ─────────────────────────────────────────────────────

interface TimetableEntry {
  day: string;
  subject: string;
  code: string;
  startTime: string; // HH:MM 24h format
  endTime: string;
  location: string;
  building: string;
  instructor: string;
  type: "lecture" | "lab" | "tutorial";
}

const MOCK_TIMETABLE: TimetableEntry[] = [
  {
    day: "Monday",
    subject: "Physics 101",
    code: "PHY101",
    startTime: "10:00",
    endTime: "11:00",
    location: "Room 304",
    building: "Science Block",
    instructor: "Dr. S. Chakrabarti",
    type: "lecture",
  },
  {
    day: "Monday",
    subject: "Mathematics I",
    code: "MAT101",
    startTime: "11:15",
    endTime: "12:15",
    location: "Room 202",
    building: "Main Block",
    instructor: "Prof. A. Iyer",
    type: "lecture",
  },
  {
    day: "Monday",
    subject: "English Communication",
    code: "HUM101",
    startTime: "14:00",
    endTime: "15:00",
    location: "Room 108",
    building: "Humanities Block",
    instructor: "Dr. M. Williams",
    type: "lecture",
  },
  {
    day: "Tuesday",
    subject: "CS Lab — Programming in C",
    code: "CSL101",
    startTime: "14:00",
    endTime: "16:00",
    location: "LAB-B",
    building: "Computer Centre",
    instructor: "Prof. R. Kumar",
    type: "lab",
  },
  {
    day: "Tuesday",
    subject: "Data Structures",
    code: "CS201",
    startTime: "10:00",
    endTime: "11:00",
    location: "Room 301",
    building: "CS Block",
    instructor: "Dr. P. Gupta",
    type: "lecture",
  },
  {
    day: "Wednesday",
    subject: "Physics 101",
    code: "PHY101",
    startTime: "10:00",
    endTime: "11:00",
    location: "Room 304",
    building: "Science Block",
    instructor: "Dr. S. Chakrabarti",
    type: "lecture",
  },
  {
    day: "Wednesday",
    subject: "Mathematics I — Tutorial",
    code: "MAT101T",
    startTime: "14:00",
    endTime: "15:00",
    location: "Room 105",
    building: "Main Block",
    instructor: "Prof. A. Iyer",
    type: "tutorial",
  },
  {
    day: "Thursday",
    subject: "Physics Lab",
    code: "PHYL101",
    startTime: "09:00",
    endTime: "11:00",
    location: "Physics Lab 2",
    building: "Science Block",
    instructor: "Dr. S. Chakrabarti",
    type: "lab",
  },
  {
    day: "Thursday",
    subject: "Data Structures",
    code: "CS201",
    startTime: "11:15",
    endTime: "12:15",
    location: "Room 301",
    building: "CS Block",
    instructor: "Dr. P. Gupta",
    type: "lecture",
  },
  {
    day: "Friday",
    subject: "Mathematics I",
    code: "MAT101",
    startTime: "10:00",
    endTime: "11:00",
    location: "Room 202",
    building: "Main Block",
    instructor: "Prof. A. Iyer",
    type: "lecture",
  },
  {
    day: "Friday",
    subject: "Digital Electronics",
    code: "EC101",
    startTime: "11:15",
    endTime: "12:15",
    location: "Room 401",
    building: "ECE Block",
    instructor: "Dr. K. Nair",
    type: "lecture",
  },
  {
    day: "Friday",
    subject: "English Communication — Tutorial",
    code: "HUM101T",
    startTime: "14:00",
    endTime: "15:00",
    location: "Room 108",
    building: "Humanities Block",
    instructor: "Dr. M. Williams",
    type: "tutorial",
  },
];

// ─── ICS Generation Helpers ──────────────────────────────────────────────────

const DAY_MAP: Record<string, string> = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
  Sunday: "SU",
};

// Get the next occurrence of a given day from a start date
function getNextDayDate(dayName: string, startDate: Date): Date {
  const dayIndex = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(dayName);
  const result = new Date(startDate);
  const currentDay = result.getDay();
  const diff = (dayIndex - currentDay + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}

// Format date to ICS datetime format: YYYYMMDDTHHMMSS
function toICSDateTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}T${h}${m}00`;
}

// Generate a UID for an event
function generateUID(entry: TimetableEntry): string {
  return `${entry.code}-${entry.day}@pal.campus`;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class CalendarService {
  /**
   * Generate a complete .ics file content for a student's timetable
   */
  generateICS(studentId: string): string {
    const semesterStart = new Date();
    // Start from next Monday
    const startDate = getNextDayDate("Monday", semesterStart);

    // Semester end (roughly 16 weeks from start)
    const semesterEnd = new Date(startDate);
    semesterEnd.setDate(semesterEnd.getDate() + 16 * 7);
    const untilDate = `${semesterEnd.getFullYear()}${String(semesterEnd.getMonth() + 1).padStart(2, "0")}${String(semesterEnd.getDate()).padStart(2, "0")}T235959Z`;

    const events = MOCK_TIMETABLE.map((entry) => {
      const eventDate = getNextDayDate(entry.day, startDate);
      const dtStart = toICSDateTime(eventDate, entry.startTime);
      const dtEnd = toICSDateTime(eventDate, entry.endTime);
      const rruleDay = DAY_MAP[entry.day];
      const uid = generateUID(entry);

      const typeEmoji =
        entry.type === "lab" ? "🔬" : entry.type === "tutorial" ? "📝" : "📚";
      const description = `${typeEmoji} ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}\\nInstructor: ${entry.instructor}\\nBuilding: ${entry.building}\\nCode: ${entry.code}`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${rruleDay};UNTIL=${untilDate}`,
        `SUMMARY:${entry.subject}`,
        `LOCATION:${entry.location}, ${entry.building}`,
        `DESCRIPTION:${description}`,
        `CATEGORIES:${entry.type.toUpperCase()}`,
        "STATUS:CONFIRMED",
        `CREATED:${toICSDateTime(new Date(), "00:00")}Z`,
        "END:VEVENT",
      ].join("\r\n");
    });

    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//P.A.L.//Campus Timetable//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:PAL Timetable — ${studentId}`,
      "X-WR-TIMEZONE:Asia/Kolkata",
      "",
      // Timezone definition
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Kolkata",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0530",
      "TZOFFSETTO:+0530",
      "TZNAME:IST",
      "END:STANDARD",
      "END:VTIMEZONE",
      "",
      ...events,
      "",
      "END:VCALENDAR",
    ].join("\r\n");

    logger.info(
      `Generated .ics calendar for student ${studentId} with ${events.length} events`,
    );
    return calendar;
  }

  /**
   * Get timetable as structured JSON
   */
  getTimetable(): TimetableEntry[] {
    return MOCK_TIMETABLE;
  }

  /**
   * Get timetable grouped by day
   */
  getTimetableByDay(): Record<string, TimetableEntry[]> {
    const grouped: Record<string, TimetableEntry[]> = {};
    for (const entry of MOCK_TIMETABLE) {
      if (!grouped[entry.day]) grouped[entry.day] = [];
      grouped[entry.day].push(entry);
    }
    // Sort each day by start time
    for (const day of Object.keys(grouped)) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }
}

export default new CalendarService();
