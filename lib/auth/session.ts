import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: string;
  role: string;
  employeeId: string;
  name: string;
  sessionCreatedAt: number;
  lastActivityAt: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'sims_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_SECONDS ?? '28800'),
  },
};

export const SESSION_IDLE_TIMEOUT_MS =
  parseInt(process.env.SESSION_IDLE_TIMEOUT_SECONDS ?? '1800') * 1000;
export const SESSION_ABSOLUTE_TIMEOUT_MS =
  parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_SECONDS ?? '28800') * 1000;