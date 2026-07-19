"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_ID_KEY = "commander-control.visitor-id";
const SESSION_ID_KEY = "commander-control.session-id";
const SESSION_STARTED_AT_KEY = "commander-control.session-started-at";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      return existing;
    }

    const nextId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_ID_KEY, nextId);
    return nextId;
  } catch {
    return "";
  }
}

function getSessionId() {
  try {
    const now = Date.now();
    const startedAt = Number(window.sessionStorage.getItem(SESSION_STARTED_AT_KEY) ?? "0");
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);

    if (existing && startedAt && now - startedAt < SESSION_TIMEOUT_MS) {
      window.sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
      return existing;
    }

    const nextId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `session-${now.toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_ID_KEY, nextId);
    window.sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
    return nextId;
  } catch {
    return "";
  }
}

function readColorScheme() {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "";
}

function readConnectionType() {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return connection?.effectiveType ?? "";
}

export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) {
      return;
    }

    const search = searchParams.toString();
    const page = search ? `${pathname}?${search}` : pathname;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const params = new URLSearchParams(search);

    void fetch("/api/visits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventName: "page_view",
        path: page,
        pathname,
        search,
        visitorId,
        sessionId,
        referrer: document.referrer || "",
        title: document.title || "",
        utmSource: params.get("utm_source") ?? "",
        utmMedium: params.get("utm_medium") ?? "",
        utmCampaign: params.get("utm_campaign") ?? "",
        utmTerm: params.get("utm_term") ?? "",
        utmContent: params.get("utm_content") ?? "",
        gclid: params.get("gclid") ?? "",
        fbclid: params.get("fbclid") ?? "",
        msclkid: params.get("msclkid") ?? "",
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        language: navigator.language || "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        platform: navigator.platform || "",
        colorScheme: readColorScheme(),
        connectionEffectiveType: readConnectionType()
      }),
      keepalive: true
    }).catch(() => {
      // Analytics should never interrupt the app.
    });
  }, [pathname, searchParams]);

  return null;
}
