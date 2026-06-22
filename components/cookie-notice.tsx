"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_NOTICE_KEY = "commander-control.cookies.accepted.v1";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasAcceptedCookies());
  }, []);

  function acceptCookies() {
    document.cookie = `${COOKIE_NOTICE_KEY}=true; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-12px_36px_rgba(0,0,0,0.42)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          Commander Control uses essential cookies for login sessions, profile access, game links, and table preferences.
        </p>
        <Button type="button" className="shrink-0" onClick={acceptCookies}>
          Accept
        </Button>
      </div>
    </div>
  );
}

function hasAcceptedCookies() {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${COOKIE_NOTICE_KEY}=true`);
}
